-- ============================================================
-- Sample Data for Testing
-- ============================================================

-- Insert default config
INSERT OR IGNORE INTO config (key, value, description) VALUES
    ('rate_limit_attempts', '5', 'Số lần đăng nhập sai tối đa trong cửa sổ thời gian'),
    ('rate_limit_window_seconds', '300', 'Cửa sổ thời gian (giây) để đếm số lần sai'),
    ('rate_limit_block_seconds', '1800', 'Thời gian khóa IP (giây) khi vượt ngưỡng'),
    ('otp_max_failures', '3', 'Số lần OTP sai tối đa trước khi bị khóa'),
    ('otp_block_seconds', '900', 'Thời gian khóa OTP (giây)'),
    ('trusted_device_threshold', '3', 'Số lần đăng nhập thành công để đánh dấu trusted'),
    ('webshell_patterns', 'shell.php,cmd.aspx,backdoor,webshell,c99.php,r57.php', 'Patterns chặn webshell'),
    ('session_timeout', '3600', 'Thời gian hết hạn session (giây)'),
    ('app_checksum', 'default_checksum_12345', 'Checksum của ứng dụng');

-- Insert sample users (passwords: admin123, password123, hackme123)
-- Password hashes are for demonstration only
INSERT OR IGNORE INTO users (username, password_hash, email, salt, role, is_premium) VALUES
    ('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMy.Mr/.6h9XjGkKx2TqJqCZaJ9LzKZ9KZq', 'admin@capyvocab.com', 'salt_admin_123', 'admin', 1),
    ('user1', '$2b$10$N9qo8uLOickgx2ZMRZoMy.Mr/.6h9XjGkKx2TqJqCZaJ9LzKZ9KZq', 'user1@capyvocab.com', 'salt_user1_123', 'user', 1),
    ('user2', '$2b$10$N9qo8uLOickgx2ZMRZoMy.Mr/.6h9XjGkKx2TqJqCZaJ9LzKZ9KZq', 'user2@capyvocab.com', 'salt_user2_123', 'user', 0),
    ('attacker', '$2b$10$N9qo8uLOickgx2ZMRZoMy.Mr/.6h9XjGkKx2TqJqCZaJ9LzKZ9KZq', 'attacker@hacker.com', 'salt_attacker_123', 'user', 0);

-- Insert sample login history (user1 đã đăng nhập nhiều lần từ thiết bị trusted)
INSERT OR IGNORE INTO login_history (username, ip, subnet, user_agent, fingerprint, success, timestamp, risk_score) VALUES
    ('user1', '192.168.1.10', '192.168.1.0/24', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'fingerprint_trusted_1', 1, strftime('%s', 'now') - 86400, 0),
    ('user1', '192.168.1.10', '192.168.1.0/24', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'fingerprint_trusted_1', 1, strftime('%s', 'now') - 172800, 0),
    ('user1', '192.168.1.10', '192.168.1.0/24', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'fingerprint_trusted_1', 1, strftime('%s', 'now') - 259200, 0);

-- Insert some security events
INSERT OR IGNORE INTO security_events (event_type, severity, ip, username, details, timestamp) VALUES
    ('login_success', 'info', '192.168.1.10', 'user1', 'Login from trusted device', strftime('%s', 'now') - 3600),
    ('rate_limit_blocked', 'high', '192.168.1.100', NULL, 'IP blocked due to too many failed attempts', strftime('%s', 'now') - 7200),
    ('webshell_blocked', 'critical', '10.0.0.5', NULL, 'Webshell attempt: /shell.php', strftime('%s', 'now') - 10800);