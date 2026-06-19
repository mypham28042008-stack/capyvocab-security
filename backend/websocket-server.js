const WebSocket = require('ws');
const { addWSClient, removeWSClient, broadcast } = require('./services/monitoring-service');

/**
 * Tạo WebSocket server độc lập
 */
function createWebSocketServer(port = 3003) {
  const wss = new WebSocket.Server({ port });
  
  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`🔌 WebSocket client connected from ${clientIp}`);
    addWSClient(ws);
    
    // Gửi thông báo kết nối
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to Capyvocab Security System',
      timestamp: new Date().toISOString(),
      clientCount: wss.clients.size
    }));
    
    // Xử lý message từ client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log(`📨 WebSocket message:`, data);
        
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
          case 'subscribe':
            // Client đăng ký nhận events
            console.log(`📋 Client subscribed to events`);
            break;
          default:
            console.log(`⚠️ Unknown message type: ${data.type}`);
        }
      } catch (error) {
        console.error('❌ WebSocket message error:', error);
      }
    });
    
    // Xử lý đóng kết nối
    ws.on('close', () => {
      console.log(`🔌 WebSocket client disconnected from ${clientIp}`);
      removeWSClient(ws);
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      removeWSClient(ws);
    });
  });
  
  wss.on('listening', () => {
    console.log(`🔄 WebSocket server running on ws://localhost:${port}`);
  });
  
  console.log(`✅ WebSocket server created on port ${port}`);
  return wss;
}

// Chạy standalone nếu file được execute trực tiếp
if (require.main === module) {
  const port = process.env.WS_PORT || 3003;
  createWebSocketServer(port);
}

module.exports = { createWebSocketServer };