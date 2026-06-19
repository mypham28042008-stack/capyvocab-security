const { getDB } = require('../config/database');

class Config {
  static async get(key) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT value FROM config WHERE key = ?',
        [key],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.value : null);
        }
      );
    });
  }

  static async set(key, value) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
        [key, value],
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
      db.all('SELECT * FROM config', (err, rows) => {
        if (err) reject(err);
        else {
          const config = {};
          rows.forEach(row => {
            config[row.key] = row.value;
          });
          resolve(config);
        }
      });
    });
  }

  static async getWebshellPatterns() {
    const patterns = await this.get('webshell_patterns');
    return patterns ? patterns.split(',').map(p => p.trim()) : [];
  }

  static async getRateLimitConfig() {
    const attempts = await this.get('rate_limit_attempts');
    const windowSec = await this.get('rate_limit_window_seconds');
    const blockSec = await this.get('rate_limit_block_seconds');
    
    return {
      maxAttempts: attempts ? parseInt(attempts) : 5,
      windowSeconds: windowSec ? parseInt(windowSec) : 300,
      blockSeconds: blockSec ? parseInt(blockSec) : 1800
    };
  }

  static async getOTPConfig() {
    const maxFailures = await this.get('otp_max_failures');
    const blockSec = await this.get('otp_block_seconds');
    
    return {
      maxFailures: maxFailures ? parseInt(maxFailures) : 3,
      blockSeconds: blockSec ? parseInt(blockSec) : 900
    };
  }
}

module.exports = Config;