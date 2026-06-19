const express = require('express');
const path = require('path');
const cors = require('cors');
const { getAllInbox, markAsRead } = require('./services/email-service');

const app = express();

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));

// Serve static files
app.use('/css', express.static(path.join(__dirname, '../frontend/web3-email-simulator/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/web3-email-simulator/js')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/web3-email-simulator/assets')));
app.use('/sprite.svg', express.static(path.join(__dirname, '../frontend/public/sprite.svg')));

// API lấy inbox
app.get('/api/email/inbox', (req, res) => {
  const inbox = getAllInbox();
  console.log('📧 Inbox requested, emails:', inbox.length);
  res.json({ success: true, inbox: inbox || [] });
});

// API lấy chi tiết email
app.get('/api/email/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const inbox = getAllInbox();
  if (id >= 0 && id < inbox.length) {
    markAsRead(id);
    res.json({ success: true, email: inbox[id] });
  } else {
    res.status(404).json({ success: false, error: 'Email not found' });
  }
});

// API xóa tất cả
app.delete('/api/email/all', (req, res) => {
  const { emailInbox } = require('./services/email-service');
  emailInbox.length = 0;
  res.json({ success: true, message: 'All emails deleted' });
});

// Gmail simulator page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/web3-email-simulator/index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'email-simulator' });
});

const PORT = process.env.EMAIL_SIMULATOR_PORT || 3002;
app.listen(PORT, () => {
  console.log(`📧 Email Simulator running on http://localhost:${PORT}`);
});

module.exports = { app };