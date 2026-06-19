const { sessions } = require('../defense-layers/layer4-session-binding');
const { generateSessionToken } = require('../encryption/fingerprint');

class SessionService {
  /**
   * Tạo session mới
   */
  static createSession(username, fingerprint, ip, userAgent) {
    const token = generateSessionToken();
    const sessionData = {
      username,
      fingerprint,
      ip,
      userAgent,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000 // 1 giờ
    };
    
    sessions.set(token, sessionData);
    return token;
  }
  
  /**
   * Lấy session
   */
  static getSession(token) {
    return sessions.get(token);
  }
  
  /**
   * Xóa session
   */
  static destroySession(token) {
    return sessions.delete(token);
  }
  
  /**
   * Kiểm tra session hợp lệ
   */
  static isValidSession(token) {
    const session = sessions.get(token);
    if (!session) return false;
    return Date.now() < session.expiresAt;
  }
  
  /**
   * Lấy thông tin user từ session
   */
  static getUserFromSession(token) {
    const session = sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      sessions.delete(token);
      return null;
    }
    return session;
  }
  
  /**
   * Refresh session (gia hạn)
   */
  static refreshSession(token) {
    const session = sessions.get(token);
    if (!session) return null;
    
    session.expiresAt = Date.now() + 3600000;
    sessions.set(token, session);
    return session;
  }
  
  /**
   * Lấy tất cả session của user
   */
  static getUserSessions(username) {
    const result = [];
    for (const [token, session] of sessions.entries()) {
      if (session.username === username) {
        result.push({ token, ...session });
      }
    }
    return result;
  }
  
  /**
   * Xóa tất cả session của user (đăng xuất tất cả thiết bị)
   */
  static destroyAllUserSessions(username) {
    let count = 0;
    for (const [token, session] of sessions.entries()) {
      if (session.username === username) {
        sessions.delete(token);
        count++;
      }
    }
    return count;
  }
}

module.exports = SessionService;