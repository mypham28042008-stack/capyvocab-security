const { getDB } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async create({ username, passwordHash, email, salt, role = 'user' }) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, password_hash, email, salt, role) VALUES (?, ?, ?, ?, ?)',
        [username, passwordHash, email, salt, role],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, username });
        }
      );
    });
  }

  static async findByUsername(username) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }

  static async updateTrustedDevice(username, isTrusted) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET is_trusted_device = ? WHERE username = ?',
        [isTrusted ? 1 : 0, username],
        function(err) {
          if (err) reject(err);
          else resolve({ updated: this.changes > 0 });
        }
      );
    });
  }

  static async getAll() {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.all('SELECT id, username, email, role, is_premium, is_trusted_device, created_at FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async updateRole(username, role) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET role = ? WHERE username = ?',
        [role, username],
        function(err) {
          if (err) reject(err);
          else resolve({ updated: this.changes > 0 });
        }
      );
    });
  }

  static async lockAccount(username, reason) {
    // Tạm thời không dùng is_locked
    console.log('🔒 Lock account:', username, reason);
    return { updated: true };
  }

  static async unlockAccount(username) {
    console.log('🔓 Unlock account:', username);
    return { updated: true };
  }
}

module.exports = User;
