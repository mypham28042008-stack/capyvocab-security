const crypto = require('crypto');

/**
 * Mã hóa dữ liệu bằng AES-256-GCM
 */
function encryptAES(plaintext, key) {
  if (!Buffer.isBuffer(key)) {
    key = Buffer.from(key, 'hex');
  }
  
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Giải mã dữ liệu AES-256-GCM
 */
function decryptAES(encryptedData, key, iv, authTag) {
  if (!Buffer.isBuffer(key)) {
    key = Buffer.from(key, 'hex');
  }
  
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Tạo khóa AES ngẫu nhiên
 */
function generateAESKey() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  encryptAES,
  decryptAES,
  generateAESKey
};