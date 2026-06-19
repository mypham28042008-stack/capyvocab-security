const SecurityEvent = require('../models/SecurityEvent');

// Danh sách header đáng ngờ - MỞ RỘNG
const SUSPICIOUS_HEADERS = [
  'x-forwarded-for',
  'via',
  'proxy-connection',
  'x-bypass-auth',
  'x-authenticated',
  'x-real-ip',
  'forwarded',
  'x-original-forwarded-for',
  'x-proxy-id',
  'x-request-id'
];

function httpsEnforcerMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const headers = req.headers;
  
  // Kiểm tra header lạ
  const suspiciousHeaders = [];
  for (const header of SUSPICIOUS_HEADERS) {
    if (headers[header]) {
      suspiciousHeaders.push(header);
    }
  }
  
  if (suspiciousHeaders.length > 0) {
    SecurityEvent.create({
      eventType: 'suspicious_headers_detected',
      severity: 'medium',
      ip: ip,
      details: `Suspicious headers: ${suspiciousHeaders.join(', ')}`
    }).catch(err => console.error('Error logging:', err));
    
    return res.status(403).json({
      error: 'Suspicious headers detected',
      suspiciousHeaders: suspiciousHeaders,
      message: 'Request blocked due to suspicious headers'
    });
  }
  
  next();
}

module.exports = { httpsEnforcerMiddleware };