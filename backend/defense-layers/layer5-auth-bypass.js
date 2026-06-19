const SecurityEvent = require('../models/SecurityEvent');

// Danh sách param/header đáng ngờ - MỞ RỘNG
const SUSPICIOUS_PARAMS = ['authenticated', 'bypass', 'admin', 'debug', 'auth', 'sudo', 'root'];
const SUSPICIOUS_HEADERS = ['x-bypass-auth', 'x-authenticated', 'x-debug', 'x-admin'];

function authBypassDetectorMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  
  // 1. Kiểm tra params (cả query và body)
  const suspiciousParams = [];
  for (const param of SUSPICIOUS_PARAMS) {
    if (req.query[param] !== undefined || req.body[param] !== undefined) {
      suspiciousParams.push(param);
    }
  }
  
  // 2. Kiểm tra headers
  const suspiciousHeaders = [];
  for (const header of SUSPICIOUS_HEADERS) {
    if (req.headers[header]) {
      suspiciousHeaders.push(header);
    }
  }
  
  // 3. Nếu phát hiện → chặn
  if (suspiciousParams.length > 0 || suspiciousHeaders.length > 0) {
    SecurityEvent.create({
      eventType: 'auth_bypass_detected',
      severity: 'critical',
      ip: ip,
      details: `Suspicious params: ${suspiciousParams.join(', ')}, Headers: ${suspiciousHeaders.join(', ')}`
    }).catch(err => console.error('Error logging:', err));
    
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Suspicious request detected',
      reason: 'Auth bypass attempt blocked'
    });
  }
  
  next();
}

module.exports = { authBypassDetectorMiddleware };