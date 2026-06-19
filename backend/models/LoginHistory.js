const { getDB } = require('../config/database');
const { encryptData, decryptData } = require('../encryption/hybrid-crypto');

class LoginHistory {
  static async create({ username, ip, subnet, userAgent, fingerprint, success, riskScore }) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO login_history 
         (username, ip, subnet, user_agent, fingerprint, success, risk_score) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [username, ip, subnet, userAgent, fingerprint, success ? 1 : 0, riskScore || 0],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  static async getLastSuccessfulLogin(username) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM login_history 
         WHERE username = ? AND success = 1 
         ORDER BY timestamp DESC LIMIT 1`,
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async getSuccessfulCountByFingerprint(username, fingerprint) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count FROM login_history 
         WHERE username = ? AND fingerprint = ? AND success = 1`,
        [username, fingerprint],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.count : 0);
        }
      );
    });
  }

  static async getHistoryByUsername(username, limit = 50) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM login_history 
         WHERE username = ? 
         ORDER BY timestamp DESC LIMIT ?`,
        [username, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async getFailedAttempts(ip, windowSeconds) {
    const db = getDB();
    const cutoff = Math.floor(Date.now() / 1000) - windowSeconds;
    
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count FROM login_history 
         WHERE ip = ? AND success = 0 AND timestamp > ?`,
        [ip, cutoff],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.count : 0);
        }
      );
    });
  }

  static async countFingerprintOccurrences(fingerprint) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM login_history WHERE fingerprint = ?',
        [fingerprint],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.count : 0);
        }
      );
    });
  }
}

module.exports = LoginHistory;