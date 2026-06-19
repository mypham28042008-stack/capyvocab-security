const LoginHistory = require('../models/LoginHistory');
const SecurityEvent = require('../models/SecurityEvent');
const OTPCode = require('../models/OTPCode');
const Config = require('../models/Config');
const { generateFingerprint } = require('../encryption/fingerprint');
const { broadcast } = require('../services/monitoring-service');

// Cache OTP blocks
const otpBlocks = new Map();

/**
 * Kiểm tra checksum của ứng dụng
 */
function verifyAppIntegrityMiddleware(req, res, next) {
  const checksum = req.headers['x-app-checksum'];
  const appVersion = req.headers['x-app-version'] || '1.0.0';
  
  // Trong thực tế, checksum được lưu trong config
  const expectedChecksum = process.env.APP_CHECKSUM || 'default_checksum';
  
  if (checksum && checksum !== expectedChecksum) {
    SecurityEvent.create({
      eventType: 'app_integrity_violation',
      severity: 'high',
      ip: req.ip,
      details: `App integrity violation: checksum mismatch (${checksum} vs ${expectedChecksum})`
    }).catch(err => console.error('Error logging:', err));
    
    return res.status(403).json({
      error: 'App integrity check failed',
      message: 'Your application appears to be modified'
    });
  }
  
  next();
}

/**
 * Xác thực OTP
 */
async function verifyOTP(req, res, next) {
  const { username, otp } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  
  if (!username || !otp) {
    return res.status(400).json({
      error: 'Missing username or OTP',
      message: 'Username and OTP are required'
    });
  }
  
  // 1. Kiểm tra OTP có bị block không?
  if (otpBlocks.has(username)) {
    const blockInfo = otpBlocks.get(username);
    const now = Math.floor(Date.now() / 1000);
    if (blockInfo.blockedUntil > now) {
      return res.status(429).json({
        error: 'OTP temporarily blocked',
        remainingSeconds: blockInfo.blockedUntil - now,
        message: 'Too many failed OTP attempts. Please try again later.'
      });
    } else {
      otpBlocks.delete(username);
    }
  }
  
  // 2. Lấy OTP từ database
  const otpRecord = await OTPCode.findByUsername(username);
  if (!otpRecord) {
    return res.status(400).json({
      error: 'Invalid OTP',
      message: 'No OTP found for this user'
    });
  }
  
  // 3. Kiểm tra hết hạn
  const now = Math.floor(Date.now() / 1000);
  if (otpRecord.expires_at < now) {
    await OTPCode.deleteByUsername(username);
    return res.status(400).json({
      error: 'OTP expired',
      message: 'OTP has expired. Please request a new one.'
    });
  }
  
  // 4. Kiểm tra số lần thử
  const config = await Config.getOTPConfig();
  if (otpRecord.attempts >= config.maxFailures) {
    const blockSeconds = config.blockSeconds;
    otpBlocks.set(username, { blockedUntil: now + blockSeconds });
    
    await SecurityEvent.create({
      eventType: 'otp_blocked',
      severity: 'medium',
      ip: ip,
      username: username,
      details: `OTP blocked for ${blockSeconds}s after ${otpRecord.attempts} failed attempts`
    });
    
    return res.status(429).json({
      error: 'OTP blocked',
      remainingSeconds: blockSeconds,
      message: 'Too many failed OTP attempts'
    });
  }
  
  // 5. Kiểm tra OTP
  if (otpRecord.otp !== otp) {
    await OTPCode.incrementAttempts(username);
    const remaining = config.maxFailures - (otpRecord.attempts + 1);
    return res.status(400).json({
      error: 'Invalid OTP',
      remainingAttempts: remaining,
      message: `Invalid OTP. ${remaining} attempts remaining.`
    });
  }
  
  // 6. OTP đúng → xóa và tiếp tục
  await OTPCode.deleteByUsername(username);
  req.otpVerified = true;
  
  next();
}

/**
 * Yêu cầu OTP cho thiết bị lạ
 */
async function requireOTPForNewDevice(req, res, next) {
  const { username } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  
  // 1. Tính fingerprint
  const fingerprint = generateFingerprint(ip, userAgent, acceptLanguage);
  
  // 2. Kiểm tra thiết bị đã trusted chưa?
  const successCount = await LoginHistory.getSuccessfulCountByFingerprint(username, fingerprint);
  const threshold = await Config.get('trusted_device_threshold') || 3;
  
  if (successCount >= threshold) {
    // Thiết bị đã trusted
    req.isTrustedDevice = true;
    return next();
  }
  
  // 3. Thiết bị lạ → yêu cầu OTP
  // Tạo OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Math.floor(Date.now() / 1000) + 300; // 5 phút
  
  await OTPCode.create({ username, otp, expiresAt });
  
  // Gửi OTP (qua email service)
  const { sendOTP } = require('../services/email-service');
  await sendOTP(username, otp);
  
  // Broadcast
  broadcast({
    type: 'otp_sent',
    username: username,
    ip: ip,
    timestamp: new Date().toISOString()
  });
  
  req.requireOTP = true;
  req.fingerprint = fingerprint;
  
  // Trả về yêu cầu OTP
  res.status(202).json({
    requireOTP: true,
    message: 'OTP sent to your email',
    username: username,
    fingerprint: fingerprint
  });
}

module.exports = {
  verifyAppIntegrityMiddleware,
  verifyOTP,
  requireOTPForNewDevice
};