const SecurityEvent = require('../models/SecurityEvent');
const Config = require('../models/Config');

async function webshellBlockerMiddleware(req, res, next) {
  const path = req.path || req.url;
  const ip = req.ip || req.connection.remoteAddress;
  
  // Lấy patterns từ config
  let patterns = await Config.getWebshellPatterns();
  if (!patterns || patterns.length === 0) {
    patterns = ['shell.php', 'cmd.aspx', 'backdoor', 'webshell', 'c99.php', 'r57.php'];
  }
  
  // Kiểm tra path có chứa pattern đáng ngờ không
  const pathLower = path.toLowerCase();
  for (const pattern of patterns) {
    if (pathLower.includes(pattern.toLowerCase())) {
      await SecurityEvent.create({
        eventType: 'webshell_blocked',
        severity: 'critical',
        ip: ip,
        details: `Blocked webshell attempt: ${path} (pattern: ${pattern})`
      });
      
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access to this resource is blocked',
        reason: 'Suspicious path detected'
      });
    }
  }
  
  next();
}

module.exports = { webshellBlockerMiddleware };