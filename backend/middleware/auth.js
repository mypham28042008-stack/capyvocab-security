const { sessions } = require('../defense-layers/layer4-session-binding');
const { generateFingerprint } = require('../encryption/fingerprint');
const SecurityEvent = require('../models/SecurityEvent');
const User = require('../models/User');

/**
 * Middleware xác thực session token
 */
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.sessionToken;
  
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }
  
  const session = sessions.get(token);
  if (!session) {
    return res.status(401).json({
      error: 'Invalid session',
      message: 'Session not found'
    });
  }
  
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return res.status(401).json({
      error: 'Session expired',
      message: 'Please login again'
    });
  }
  
  // Kiểm tra fingerprint
  const currentFingerprint = generateFingerprint(
    req.ip || req.connection.remoteAddress,
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || ''
  );
  
  if (session.fingerprint !== currentFingerprint) {
    SecurityEvent.create({
      eventType: 'session_hijack_detected',
      severity: 'critical',
      ip: req.ip,
      username: session.username,
      details: `Fingerprint mismatch: ${session.fingerprint} vs ${currentFingerprint}`
    }).catch(err => console.error('Error logging:', err));
    
    sessions.delete(token);
    return res.status(401).json({
      error: 'Session hijack detected',
      message: 'Please login again'
    });
  }
  
  // Lấy user từ database để có role
  let role = 'user';
  let userData = null;
  try {
    userData = await User.findByUsername(session.username);
    if (userData) {
      role = userData.role || 'user';
    }
  } catch (err) {
    console.error('Error fetching user role:', err);
  }
  
  req.user = {
    username: session.username,
    fingerprint: session.fingerprint,
    token: token,
    role: role,
    userData: userData,
    session: session
  };
  
  next();
}

/**
 * Middleware kiểm tra quyền admin
 */
function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin privileges required'
    });
  }
  
  next();
}

module.exports = { authMiddleware, adminMiddleware };