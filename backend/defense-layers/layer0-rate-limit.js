const LoginHistory = require('../models/LoginHistory');
const SecurityEvent = require('../models/SecurityEvent');
const Config = require('../models/Config');
const { broadcast } = require('../services/monitoring-service');

// Cache cho IP bị chặn (lưu trong RAM)
const blockedIPs = new Map();
// Cache cho số lần thử trong cửa sổ thời gian
const attemptCounts = new Map();

async function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Math.floor(Date.now() / 1000);
  
  // 1. Kiểm tra IP đang bị chặn?
  if (blockedIPs.has(ip)) {
    const blockInfo = blockedIPs.get(ip);
    if (blockInfo.blockedUntil > now) {
      const remaining = blockInfo.blockedUntil - now;
      return res.status(429).json({
        error: `Too many failed attempts. Blocked for ${remaining} seconds.`,
        remainingSeconds: remaining,
        blocked: true
      });
    } else {
      blockedIPs.delete(ip);
      attemptCounts.delete(ip);
    }
  }
  
  // 2. Lấy config
  const config = await Config.getRateLimitConfig();
  const { maxAttempts, windowSeconds, blockSeconds } = config;
  
  // 3. Lấy số lần thử từ cache
  let attemptData = attemptCounts.get(ip);
  if (!attemptData) {
    attemptData = { count: 0, firstAttempt: now };
    attemptCounts.set(ip, attemptData);
  }
  
  // Reset nếu hết cửa sổ thời gian
  if (now - attemptData.firstAttempt > windowSeconds) {
    attemptData.count = 0;
    attemptData.firstAttempt = now;
  }
  
  // 4. Đếm số lần thất bại
  const failedCount = attemptData.count;
  
  // 5. Nếu là request login (POST /api/login), tăng count
  if (req.path === '/api/login' && req.method === 'POST') {
    attemptData.count++;
  }
  
  // 6. Nếu vượt ngưỡng → chặn
  if (attemptData.count >= maxAttempts) {
    const blockedUntil = now + blockSeconds;
    blockedIPs.set(ip, { blockedUntil });
    attemptCounts.delete(ip);
    
    await SecurityEvent.create({
      eventType: 'rate_limit_blocked',
      severity: 'high',
      ip: ip,
      details: `Blocked IP ${ip} for ${blockSeconds}s (${attemptData.count} failed attempts)`
    });
    
    broadcast({
      type: 'blocked',
      layer: 'Rate Limit',
      ip: ip,
      attempts: attemptData.count,
      blockedUntil: blockedUntil
    });
    
    return res.status(429).json({
      error: `Too many failed attempts. Blocked for ${blockSeconds} seconds.`,
      remainingSeconds: blockSeconds,
      blocked: true
    });
  }
  
  req.rateLimit = {
    attempts: attemptData.count,
    maxAttempts: maxAttempts,
    windowSeconds: windowSeconds
  };
  
  next();
}

// Cleanup định kỳ (mỗi 5 phút)
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const [ip, info] of blockedIPs.entries()) {
    if (info.blockedUntil < now) {
      blockedIPs.delete(ip);
    }
  }
  for (const [ip, data] of attemptCounts.entries()) {
    if (now - data.firstAttempt > 3600) {
      attemptCounts.delete(ip);
    }
  }
}, 300000);

module.exports = { rateLimitMiddleware, blockedIPs };