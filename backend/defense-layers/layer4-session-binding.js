const { generateFingerprint, generateSessionToken } = require('../encryption/fingerprint');
const SecurityEvent = require('../models/SecurityEvent');
const LoginHistory = require('../models/LoginHistory');

// Cache session tokens (trong thực tế dùng Redis)
const sessions = new Map();

/**
 * Tạo session binding
 */
async function createSessionBinding(req, res, next) {
  const { username } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  
  // 1. Tạo fingerprint
  const fingerprint = generateFingerprint(ip, userAgent, acceptLanguage);
  
  // 2. Tạo session token
  const token = generateSessionToken();
  
  // 3. Lưu session
  const sessionData = {
    username,
    fingerprint,
    ip,
    userAgent,
    createdAt: Date.now(),
    expiresAt: Date.now() + 3600000 // 1 giờ
  };
  
  sessions.set(token, sessionData);
  
  // 4. Lưu vào login_history
  await LoginHistory.create({
    username,
    ip,
    subnet: generateFingerprint(ip, 'subnet', ''),
    userAgent,
    fingerprint,
    success: 1,
    riskScore: 0
  });
  
  // 5. Trả về token
  res.json({
    success: true,
    token: token,
    fingerprint: fingerprint,
    message: 'Login successful'
  });
}

/**
 * Xác thực session
 */
function validateSessionMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.sessionToken;
  
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Session token required'
    });
  }
  
  // 1. Kiểm tra session tồn tại
  const session = sessions.get(token);
  if (!session) {
    return res.status(401).json({
      error: 'Invalid session',
      message: 'Session not found'
    });
  }
  
  // 2. Kiểm tra hết hạn
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return res.status(401).json({
      error: 'Session expired',
      message: 'Please login again'
    });
  }
  
  // 3. Kiểm tra fingerprint
  const currentFingerprint = generateFingerprint(
    req.ip || req.connection.remoteAddress,
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || ''
  );
  
  if (session.fingerprint !== currentFingerprint) {
    // Phát hiện session hijacking
    SecurityEvent.create({
      eventType: 'session_hijack_detected',
      severity: 'critical',
      ip: req.ip,
      username: session.username,
      details: `Session hijack detected: ${session.fingerprint} vs ${currentFingerprint}`
    }).catch(err => console.error('Error logging:', err));
    
    sessions.delete(token);
    
    return res.status(401).json({
      error: 'Session hijack detected',
      message: 'Please login again'
    });
  }
  
  // 4. Gắn thông tin vào request
  req.user = {
    username: session.username,
    fingerprint: session.fingerprint,
    token: token
  };
  
  next();
}

/**
 * Hủy session (logout)
 */
function destroySession(token) {
  sessions.delete(token);
}

module.exports = {
  createSessionBinding,
  validateSessionMiddleware,
  destroySession,
  sessions
};