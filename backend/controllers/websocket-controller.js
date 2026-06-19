const WebSocket = require('ws');
const { addWSClient, removeWSClient, broadcast } = require('../services/monitoring-service');
const { sessions } = require('../defense-layers/layer4-session-binding');

/**
 * Khởi tạo WebSocket server
 */
function initWebSocketServer(server, path = '/ws') {
  const wss = new WebSocket.Server({ server, path });
  
  wss.on('connection', (ws, req) => {
    console.log('🔌 WebSocket client connected');
    addWSClient(ws);
    
    // Gửi thông báo kết nối
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to Capyvocab Security System',
      timestamp: new Date().toISOString()
    }));
    
    // Xử lý message từ client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('📨 WebSocket message:', data);
        
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    // Xử lý đóng kết nối
    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected');
      removeWSClient(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      removeWSClient(ws);
    });
  });
  
  console.log(`🔄 WebSocket server running on ${path}`);
  return wss;
}

module.exports = { initWebSocketServer };