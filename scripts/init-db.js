const { initDatabase } = require('../backend/config/database');
const fs = require('fs');
const path = require('path');

console.log('🔄 Initializing database...');

// Đọc và chạy migration
const migrationPath = path.join(__dirname, '../backend/migrations/001_init_database.sql');
const samplePath = path.join(__dirname, '../backend/migrations/002_sample_data.sql');

try {
  // Đảm bảo thư mục data tồn tại
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Khởi tạo database
  const db = initDatabase();
  
  // Đọc và chạy migration SQL
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  const sampleSQL = fs.readFileSync(samplePath, 'utf8');
  
  db.exec(migrationSQL);
  db.exec(sampleSQL);
  
  console.log('✅ Database initialized successfully');
  console.log('📊 Sample data inserted');
  console.log('📁 Database location: ./data/capyvocab.db');
  
  db.close();
} catch (error) {
  console.error('❌ Error initializing database:', error);
  process.exit(1);
}