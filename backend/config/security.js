const crypto = require('crypto');

module.exports = {
  // JWT Secret (từ biến môi trường)
  JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
  
  // Salt rounds cho bcrypt
  SALT_ROUNDS: 10,
  
  // CORS config
  CORS_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ],
  
  // Rate limit cho API
  API_RATE_LIMIT: {
    windowMs: 60000,          // 1 phút
    max: 100                  // 100 request/phút
  },
  
  // Cấu hình email (SMTP)
  EMAIL: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    user: process.env.SMTP_USER || 'capyvocab.test@gmail.com',
    pass: process.env.SMTP_PASS || '',
    from: 'Capyvocab Security <security@capyvocab.com>'
  },
  
  // Cấu hình log
  LOG: {
    level: process.env.LOG_LEVEL || 'info',
    maxSize: '10m',
    maxFiles: 5
  }
};