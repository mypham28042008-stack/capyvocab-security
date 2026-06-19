const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');
const APP_LOG = path.join(LOG_DIR, 'app.log');
const SECURITY_LOG = path.join(LOG_DIR, 'security.log');

// Đảm bảo thư mục logs tồn tại
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Ghi log vào file
 */
function writeLog(file, message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(file, logEntry);
}

/**
 * Middleware ghi log request
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  
  // Ghi log khi request hoàn thành
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `${req.method} ${req.url} ${res.statusCode} ${duration}ms - ${req.ip || req.connection.remoteAddress}`;
    
    if (res.statusCode >= 400) {
      writeLog(APP_LOG, `⚠️ ${logMessage}`);
    } else {
      writeLog(APP_LOG, `✅ ${logMessage}`);
    }
    
    // Ghi security log cho các sự kiện quan trọng
    if (res.statusCode >= 500 || req.url.includes('/api/login') || req.url.includes('/api/admin')) {
      writeLog(SECURITY_LOG, `🔐 ${logMessage}`);
    }
  });
  
  next();
}

/**
 * Ghi log security event
 */
function logSecurity(message, severity = 'info') {
  const levels = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    critical: '🚨'
  };
  const prefix = levels[severity] || 'ℹ️';
  writeLog(SECURITY_LOG, `${prefix} ${message}`);
}

module.exports = { requestLogger, logSecurity };