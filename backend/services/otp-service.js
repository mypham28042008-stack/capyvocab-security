const OTPCode = require('../models/OTPCode');
const SecurityEvent = require('../models/SecurityEvent');
const Config = require('../models/Config');

class OTPService {
  /**
   * Tạo OTP mới
   */
  static async generateOTP(username) {
    // Xóa OTP cũ
    await OTPCode.deleteByUsername(username);
    
    // Tạo OTP mới
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Math.floor(Date.now() / 1000) + 300; // 5 phút
    
    await OTPCode.create({ username, otp, expiresAt });
    
    return otp;
  }
  
  /**
   * Xác thực OTP
   */
  static async verifyOTP(username, otp) {
    // 1. Lấy OTP
    const record = await OTPCode.findByUsername(username);
    if (!record) {
      return { success: false, error: 'No OTP found' };
    }
    
    // 2. Kiểm tra hết hạn
    const now = Math.floor(Date.now() / 1000);
    if (record.expires_at < now) {
      await OTPCode.deleteByUsername(username);
      return { success: false, error: 'OTP expired' };
    }
    
    // 3. Kiểm tra số lần thử
    const config = await Config.getOTPConfig();
    if (record.attempts >= config.maxFailures) {
      return { success: false, error: 'Too many failed attempts' };
    }
    
    // 4. Kiểm tra OTP
    if (record.otp !== otp) {
      await OTPCode.incrementAttempts(username);
      const remaining = config.maxFailures - (record.attempts + 1);
      return { 
        success: false, 
        error: 'Invalid OTP', 
        remainingAttempts: remaining 
      };
    }
    
    // 5. OTP đúng → xóa
    await OTPCode.deleteByUsername(username);
    
    // 6. Ghi log
    await SecurityEvent.create({
      eventType: 'otp_verified',
      severity: 'info',
      username: username,
      details: 'OTP verified successfully'
    });
    
    return { success: true };
  }
  
  /**
   * Kiểm tra OTP có bị block không
   */
  static async isBlocked(username) {
    return await OTPCode.isBlocked(username);
  }
  
  /**
   * Dọn dẹp OTP hết hạn
   */
  static async cleanupExpired() {
    const result = await OTPCode.cleanupExpired();
    return result.deleted;
  }
}

module.exports = OTPService;