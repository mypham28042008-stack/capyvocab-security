-- ============================================================
-- Capyvocab Security System - Database Schema
-- ============================================================

-- Bảng users: lưu thông tin người dùng
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
    is_locked INTEGER DEFAULT 0,
    locked_reason TEXT,
    locked_at INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Bảng login_history: lịch sử đăng nhập
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
);

-- Bảng security_events: sự kiện bảo mật
CREATE TABLE IF NOT EXISTS security_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    ip TEXT,
    username TEXT,
    details TEXT,
    timestamp INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Bảng otp_codes: mã OTP tạm thời
CREATE TABLE IF NOT EXISTS otp_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Bảng config: cấu hình hệ thống
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Bảng sessions: session token (có thể dùng Redis trong production)
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    expires_at INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_history_username ON login_history(username);
CREATE INDEX IF NOT EXISTS idx_login_history_timestamp ON login_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_login_history_ip ON login_history(ip);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_otp_codes_username ON otp_codes(username);