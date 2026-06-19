const crypto = require('crypto');

/**
 * Dẫn xuất khóa từ password và salt bằng PBKDF2
 * @param {string} password - Mật khẩu người dùng
 * @param {string} salt - Salt (16 bytes, hex)
 * @param {number} iterations - Số vòng lặp (mặc định: 100000)
 * @param {number} keyLength - Độ dài khóa (mặc định: 32 bytes)
 * @param {string} digest - Thuật toán hash (mặc định: 'sha256')
 * @returns {string} Khóa AES (hex)
 */
function deriveKey(password, salt, iterations = 100000, keyLength = 32, digest = 'sha256') {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      Buffer.from(salt, 'hex'),
      iterations,
      keyLength,
      digest,
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey.toString('hex'));
      }
    );
  });
}

/**
 * Tạo salt ngẫu nhiên
 */
function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash mật khẩu bằng PBKDF2 (dùng cho lưu trữ)
 */
async function hashPassword(password, salt, iterations = 100000) {
  const hash = await deriveKey(password, salt, iterations, 64, 'sha512');
  return hash;
}

/**
 * Xác thực mật khẩu
 */
async function verifyPassword(password, salt, hash) {
  const computedHash = await hashPassword(password, salt);
  return computedHash === hash;
}

module.exports = {
  deriveKey,
  generateSalt,
  hashPassword,
  verifyPassword
};