const { encryptAES, decryptAES } = require('./aes-encryption');
const { deriveKey, generateSalt } = require('./pbkdf2-hasher');

/**
 * Mã hóa dữ liệu bằng AES-256-GCM (hybrid với PBKDF2)
 * @param {string} plaintext - Dữ liệu cần mã hóa
 * @param {string} password - Mật khẩu (dùng để derive key)
 * @param {string} salt - Salt (16 bytes, hex)
 * @returns {Object} { encrypted, iv, authTag, salt }
 */
async function encryptData(plaintext, password, salt) {
  // Dẫn xuất khóa AES từ password và salt
  const key = await deriveKey(password, salt);
  
  // Mã hóa dữ liệu
  const result = encryptAES(plaintext, key);
  
  return {
    ...result,
    salt: salt
  };
}

/**
 * Giải mã dữ liệu AES-256-GCM
 * @param {string} encrypted - Dữ liệu mã hóa (hex)
 * @param {string} password - Mật khẩu
 * @param {string} salt - Salt (hex)
 * @param {string} iv - IV (hex)
 * @param {string} authTag - Auth tag (hex)
 * @returns {string} Dữ liệu đã giải mã
 */
async function decryptData(encrypted, password, salt, iv, authTag) {
  // Dẫn xuất khóa AES từ password và salt
  const key = await deriveKey(password, salt);
  
  // Giải mã dữ liệu
  return decryptAES(encrypted, key, iv, authTag);
}

/**
 * Mã hóa dữ liệu với salt tự động sinh
 */
async function encryptDataWithAutoSalt(plaintext, password) {
  const salt = generateSalt();
  return await encryptData(plaintext, password, salt);
}

/**
 * Kiểm tra tính toàn vẹn của dữ liệu mã hóa
 */
function verifyEncryptedDataIntegrity(encryptedData) {
  // Kiểm tra cấu trúc
  if (!encryptedData || typeof encryptedData !== 'object') {
    return false;
  }
  
  const requiredFields = ['encrypted', 'iv', 'authTag', 'salt'];
  for (const field of requiredFields) {
    if (!encryptedData[field]) {
      return false;
    }
  }
  
  return true;
}

module.exports = {
  encryptData,
  decryptData,
  encryptDataWithAutoSalt,
  verifyEncryptedDataIntegrity
};