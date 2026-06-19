const { logSecurity } = require('./logger');

/**
 * Middleware xử lý lỗi tập trung
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  // Ghi log lỗi
  console.error(`❌ Error: ${message}`);
  console.error(err.stack);
  
  logSecurity(`Error ${statusCode}: ${message} - ${req.url}`, statusCode >= 500 ? 'error' : 'warning');
  
  // Trả về response
  res.status(statusCode).json({
    error: message,
    statusCode: statusCode,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * Lớp lỗi tùy chỉnh
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };