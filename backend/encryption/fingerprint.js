const crypto = require('crypto');

/**
 * Tạo fingerprint từ IP, User-Agent, Accept-Language
 * @param {string} ip - Địa chỉ IP
 * @param {string} userAgent - User-Agent header
 * @param {string} acceptLanguage - Accept-Language header
 * @returns {string} SHA256 hash
 */
function generateFingerprint(ip, userAgent, acceptLanguage) {
  const data = `${ip}|${userAgent}|${acceptLanguage || 'en-US'}`;
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Tạo subnet (/24) từ địa chỉ IP
 */
function getSubnet(ip) {
  // Xử lý IPv6 (đơn giản hóa)
  if (ip.includes(':')) {
    return ip.split(':').slice(0, 4).join(':') + '::/64';
  }
  
  // IPv4
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
  }
  
  return ip;
}

/**
 * Kiểm tra fingerprint có khớp không
 */
function matchFingerprints(fingerprint1, fingerprint2) {
  return fingerprint1 === fingerprint2;
}

/**
 * Tạo session token ngẫu nhiên
 */
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  generateFingerprint,
  getSubnet,
  matchFingerprints,
  generateSessionToken
};