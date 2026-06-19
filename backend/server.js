const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const WebSocket = require('ws');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const { webshellBlockerMiddleware } = require('./defense-layers/layer2-webshell-blocker');

try {
  initDatabase();
  console.log('✅ Database connected');
} catch (error) {
  console.error('❌ Database error:', error);
}

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/sprite.svg', express.static(path.join(__dirname, '../frontend/public/sprite.svg')));
app.use(express.static(path.join(__dirname, '../frontend/web1-login')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/web1-login/assets')));
app.use('/css', express.static(path.join(__dirname, '../frontend/web1-login/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/web1-login/js')));

app.use(webshellBlockerMiddleware);

const authRoutes = require('./routes/auth-routes');
const adminRoutes = require('./routes/admin-routes');
const dashboardRoutes = require('./routes/dashboard-routes');
const testRoutes = require('./routes/test-routes');

app.use(authRoutes);
app.use(adminRoutes);
app.use(dashboardRoutes);
app.use(testRoutes);

// ============================================
// === THÊM DASHBOARD ROUTES ===
// ============================================
const SecurityEvent = require('./models/SecurityEvent');

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const events = await SecurityEvent.getRecent(1000);
    const totalRequests = events.length;
    const blockedAttempts = events.filter(e => e.event_type && e.event_type.includes('blocked')).length;
    const criticalEvents = events.filter(e => e.severity === 'critical').length;
    const wsCount = global.wsClients ? global.wsClients.size : 0;
    
    res.json({
      success: true,
      stats: {
        totalRequests: totalRequests || 0,
        blockedAttempts: blockedAttempts || 0,
        criticalEvents: criticalEvents || 0,
        wsConnections: wsCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/dashboard/events', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const events = await SecurityEvent.getRecent(limit);
    res.json({ success: true, events: events || [] });
  } catch (error) {
    console.error('Events error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/dashboard/event-stats', async (req, res) => {
  try {
    const stats = await SecurityEvent.getStats();
    res.json({ success: true, stats: stats || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/dashboard/top-blocked-ips', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const events = await SecurityEvent.getRecent(1000);
    const blockedEvents = events.filter(e => e.event_type && e.event_type.includes('blocked'));
    
    const ipCount = {};
    blockedEvents.forEach(e => {
      if (e.ip) {
        ipCount[e.ip] = (ipCount[e.ip] || 0) + 1;
      }
    });
    
    const topIPs = Object.entries(ipCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([ip, count]) => ({ ip, count }));
    
    res.json({ success: true, topIPs: topIPs || [] });
  } catch (error) {
    console.error('Top IPs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// ============================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/web1-login/index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'capyvocab-security' });
});

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🛡️ Capyvocab Security System`);
  console.log(`✅ Main server running on http://localhost:${PORT}`);
  console.log(`📧 Web 1: Login page`);
});

// ===== WEBSOCKET SERVER =====
global.wsClients = new Set();

function addWSClient(client) {
  global.wsClients.add(client);
  console.log('➕ Client added. Total clients:', global.wsClients.size);
}

function removeWSClient(client) {
  global.wsClients.delete(client);
  console.log('➖ Client removed. Total clients:', global.wsClients.size);
}

function getWSClientCount() {
  console.log('🔍 getWSClientCount called, returning:', global.wsClients.size);
  return global.wsClients.size;
}

const monitoringService = require('./services/monitoring-service');
monitoringService.wsClients = global.wsClients;
monitoringService.addWSClient = addWSClient;
monitoringService.removeWSClient = removeWSClient;
monitoringService.getWSClientCount = getWSClientCount;

const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  console.log('🔌 WebSocket client connected');
  addWSClient(ws);
  
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Capyvocab Security System',
    timestamp: new Date().toISOString()
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 WebSocket message:', data);
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    removeWSClient(ws);
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    removeWSClient(ws);
  });
});

console.log(`🔄 WebSocket server running on /ws`);

module.exports = { app, server, wss };