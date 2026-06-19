const { getDB } = require('../config/database');

class OTPCode {
  static async create({ username, otp, expiresAt }) {
    const db = getDB();
    
    // Xóa OTP cũ
    await this.deleteByUsername(username);
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO otp_codes (username, otp, expires_at) VALUES (?, ?, ?)`,
        [username, otp, expiresAt],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  static async findByUsername(username) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM otp_codes WHERE username = ? ORDER BY created_at DESC LIMIT 1',
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async incrementAttempts(username) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE otp_codes SET attempts = attempts + 1 WHERE username = ?',
        [username],
        function(err) {
          if (err) reject(err);
          else resolve({ updated: this.changes > 0 });
        }
      );
    });
  }

  static async deleteByUsername(username) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM otp_codes WHERE username = ?',
        [username],
        function(err) {
          if (err) reject(err);
          else resolve({ deleted: this.changes });
        }
      );
    });
  }

  static async cleanupExpired() {
    const db = getDB();
    const now = Math.floor(Date.now() / 1000);
    
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM otp_codes WHERE expires_at < ?',
        [now],
        function(err) {
          if (err) reject(err);
          else resolve({ deleted: this.changes });
        }
      );
    });
  }

  static async isBlocked(username) {
    const record = await this.findByUsername(username);
    if (!record) return false;
    
    const maxFailures = await this.getMaxFailures();
    return record.attempts >= maxFailures;
  }

  static async getMaxFailures() {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT value FROM config WHERE key = ?',
        ['otp_max_failures'],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? parseInt(row.value) : 3);
        }
      );
    });
  }
}

module.exports = OTPCode;