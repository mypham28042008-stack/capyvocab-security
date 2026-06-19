const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));

// Serve static files
app.use('/css', express.static(path.join(__dirname, '../frontend/web2-dashboard/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/web2-dashboard/js')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/web2-dashboard/assets')));
app.use('/sprite.svg', express.static(path.join(__dirname, '../frontend/public/sprite.svg')));

// === PROXY ĐẾN MAIN SERVER (PORT 3000) ===
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const response = await fetch('http://localhost:3000/api/dashboard/stats');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/dashboard/events', async (req, res) => {
  try {
    const response = await fetch('http://localhost:3000/api/dashboard/events' + req.url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/dashboard/event-stats', async (req, res) => {
  try {
    const response = await fetch('http://localhost:3000/api/dashboard/event-stats');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/dashboard/top-blocked-ips', async (req, res) => {
  try {
    const response = await fetch('http://localhost:3000/api/dashboard/top-blocked-ips' + req.url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const dashboardRoutes = require('./routes/dashboard-routes');
const adminRoutes = require('./routes/admin-routes');

app.use(dashboardRoutes);
app.use(adminRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/web2-dashboard/index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'dashboard' });
});

const PORT = process.env.DASHBOARD_PORT || 3001;
app.listen(PORT, () => {
  console.log(`📊 Dashboard server running on http://localhost:${PORT}`);
});

module.exports = { app };