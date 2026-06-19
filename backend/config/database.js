const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/capyvocab.db');

// Khởi tạo database với các bảng
function initDatabase() {
  const db = new sqlite3.Database(DB_PATH);
  
  db.serialize(() => {
    // Bảng users
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT NOT NULL,
        salt TEXT NOT NULL,
        encrypted_rsa_private_key TEXT,
        rsa_public_key TEXT,
        role TEXT DEFAULT 'user',
        is_premium INTEGER DEFAULT 0,
        is_trusted_device INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Bảng login_history
    db.run(`
      CREATE TABLE IF NOT EXISTS login_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        ip TEXT NOT NULL,
        subnet TEXT NOT NULL,
        user_agent TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        success INTEGER DEFAULT 0,
        timestamp INTEGER DEFAULT (strftime('%s', 'now')),
        risk_score INTEGER DEFAULT 0
      )
    `);

    // Bảng security_events
    db.run(`
      CREATE TABLE IF NOT EXISTS security_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        ip TEXT,
        username TEXT,
        details TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Bảng otp_codes
    db.run(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        otp TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Bảng config
    db.run(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT
      )
    `);

    // Chèn config mặc định
    const defaultConfigs = [
      ['rate_limit_attempts', '5', 'Số lần đăng nhập sai tối đa'],
      ['rate_limit_window_seconds', '300', 'Cửa sổ thời gian (giây)'],
      ['rate_limit_block_seconds', '1800', 'Thời gian khóa IP (giây)'],
      ['otp_max_failures', '3', 'Số lần OTP sai tối đa'],
      ['otp_block_seconds', '900', 'Thời gian khóa OTP (giây)'],
      ['trusted_device_threshold', '3', 'Số lần đăng nhập để trusted'],
      ['webshell_patterns', 'shell.php,cmd.aspx,backdoor', 'Patterns chặn webshell'],
      ['session_timeout', '3600', 'Thời gian hết hạn session (giây)']
    ];

    defaultConfigs.forEach(([key, value, description]) => {
      db.run(
        `INSERT OR IGNORE INTO config (key, value, description) VALUES (?, ?, ?)`,
        [key, value, description]
      );
    });

    console.log('✅ Database initialized successfully');
  });

  return db;
}

function getDB() {
  const db = new sqlite3.Database(DB_PATH);
  return db;
}

module.exports = { initDatabase, getDB };