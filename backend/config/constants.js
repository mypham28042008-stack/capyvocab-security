module.exports = {
  // Ngưỡng bảo mật
  RATE_LIMIT: {
    MAX_ATTEMPTS: 5,
    WINDOW_SECONDS: 300,      // 5 phút
    BLOCK_SECONDS: 1800       // 30 phút
  },
  
  OTP: {
    MAX_FAILURES: 3,
    BLOCK_SECONDS: 900,       // 15 phút
    EXPIRY_SECONDS: 300,      // 5 phút
    LENGTH: 6
  },
  
  TRUSTED_DEVICE: {
    THRESHOLD: 3              // Số lần đăng nhập thành công
  },
  
  SESSION: {
    TIMEOUT_SECONDS: 3600,    // 1 giờ
    TOKEN_LENGTH: 32
  },
  
  ENCRYPTION: {
    AES_ALGORITHM: 'aes-256-gcm',
    AES_KEY_LENGTH: 32,       // 256 bits
    IV_LENGTH: 12,
    PBKDF2_ITERATIONS: 100000,
    PBKDF2_DIGEST: 'sha256',
    RSA_KEY_SIZE: 2048
  },
  
  WEBSHELL_PATTERNS: [
    'shell.php',
    'cmd.aspx',
    'backdoor',
    'webshell',
    'c99.php',
    'r57.php'
  ],
  
  // Các header đáng ngờ
  SUSPICIOUS_HEADERS: [
    'x-forwarded-for',
    'via',
    'proxy-connection',
    'x-bypass-auth'
  ],
  
  // Các tham số đáng ngờ
  SUSPICIOUS_PARAMS: [
    'authenticated',
    'bypass',
    'admin',
    'debug'
  ],
  
  // Ports
  PORTS: {
    MAIN: 3000,
    DASHBOARD: 3001,
    EMAIL_SIMULATOR: 3002,
    WEBSOCKET: 3003
  }
};