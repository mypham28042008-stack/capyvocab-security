const fs = require('fs');
const path = require('path');

const EMAIL_DB_PATH = path.join(__dirname, '../../data/emails.json');

// Đảm bảo file tồn tại
if (!fs.existsSync(EMAIL_DB_PATH)) {
  fs.writeFileSync(EMAIL_DB_PATH, JSON.stringify([]));
}

// Đọc email từ file
function readEmails() {
  try {
    const data = fs.readFileSync(EMAIL_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Ghi email vào file
function writeEmails(emails) {
  fs.writeFileSync(EMAIL_DB_PATH, JSON.stringify(emails, null, 2));
}

async function sendOTP(username, otp) {
  console.log('📧 ===== SENDING OTP =====');
  console.log('📧 Username:', username);
  console.log('📧 OTP:', otp);
  
  const email = {
    id: Date.now(),
    to: username + '@capyvocab.com',
    from: 'security@capyvocab.com',
    subject: '🔐 Your OTP Code: ' + otp,
    body: 'Your OTP code is: <strong>' + otp + '</strong>',
    otp: otp,
    username: username,
    timestamp: Date.now(),
    read: false
  };
  
  // Lưu vào file
  const emails = readEmails();
  emails.push(email);
  writeEmails(emails);
  
  console.log('📧 Email saved. Total emails:', emails.length);
  
  return { success: true, message: 'OTP sent' };
}

function getAllInbox() {
  const emails = readEmails();
  console.log('📧 getAllInbox called. Total emails:', emails.length);
  return emails;
}

function markAsRead(emailId) {
  const emails = readEmails();
  const email = emails.find(e => e.id === emailId);
  if (email) {
    email.read = true;
    writeEmails(emails);
  }
}

function clearAllEmails() {
  writeEmails([]);
  console.log('🗑️ All emails cleared');
}

module.exports = {
  sendOTP,
  getAllInbox,
  markAsRead,
  clearAllEmails
};
