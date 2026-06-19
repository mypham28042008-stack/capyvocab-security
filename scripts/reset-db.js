const fs = require('fs');
const path = require('path');
const { initDatabase } = require('../backend/config/database');

const DB_PATH = path.join(__dirname, '../data/capyvocab.db');

console.log('🔄 Resetting database...');

try {
  // Xóa database cũ
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('🗑️ Old database deleted');
  }
  
  // Khởi tạo lại
  const db = initDatabase();
  
  // Đọc và chạy migration
  const migrationPath = path.join(__dirname, '../backend/migrations/001_init_database.sql');
  const samplePath = path.join(__dirname, '../backend/migrations/002_sample_data.sql');
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  const sampleSQL = fs.readFileSync(samplePath, 'utf8');
  
  db.exec(migrationSQL);
  db.exec(sampleSQL);
  
  console.log('✅ Database reset successfully');
  db.close();
} catch (error) {
  console.error('❌ Error resetting database:', error);
  process.exit(1);
}