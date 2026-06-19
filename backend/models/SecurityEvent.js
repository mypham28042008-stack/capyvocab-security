const { getDB } = require('../config/database');

class SecurityEvent {
  static async create({ eventType, severity, ip, username, details }) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO security_events 
         (event_type, severity, ip, username, details) 
         VALUES (?, ?, ?, ?, ?)`,
        [eventType, severity, ip, username, details || ''],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  static async getRecent(limit = 100) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM security_events 
         ORDER BY timestamp DESC LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async getByType(eventType, limit = 50) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM security_events 
         WHERE event_type = ? 
         ORDER BY timestamp DESC LIMIT ?`,
        [eventType, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async getStats() {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT event_type, COUNT(*) as count, severity 
         FROM security_events 
         GROUP BY event_type, severity`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async getEventsBySeverity(severity, limit = 50) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM security_events 
         WHERE severity = ? 
         ORDER BY timestamp DESC LIMIT ?`,
        [severity, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async countByEventType(eventType) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM security_events WHERE event_type = ?',
        [eventType],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.count : 0);
        }
      );
    });
  }
}

module.exports = SecurityEvent;