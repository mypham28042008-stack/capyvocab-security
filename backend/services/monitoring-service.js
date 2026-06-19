const SecurityEvent = require('../models/SecurityEvent');

// WebSocket clients - DÙNG GLOBAL ĐỂ KHÔNG BỊ RESET
global.wsClients = global.wsClients || new Set();

// === THÊM LOG KHỞI TẠO ===
console.log('🔧 [monitoring] Initialized with global.wsClients, size:', global.wsClients.size);

/**
 * Ghi log sự kiện
 */
async function logEvent(eventType, severity, ip, username, details) {
  try {
    await SecurityEvent.create({
      eventType,
      severity,
      ip,
      username,
      details
    });
    
    // Broadcast sự kiện
    broadcast({
      type: 'security_event',
      eventType,
      severity,
      ip,
      username,
      details,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error logging event:', error);
  }
}

/**
 * Broadcast sự kiện qua WebSocket
 */
function broadcast(data) {
  const message = JSON.stringify(data);
  console.log('📡 Broadcasting to', global.wsClients.size, 'clients:', data.type || 'unknown');
  
  for (const client of global.wsClients) {
    if (client.readyState === 1) { // OPEN
      client.send(message);
      console.log('✅ Sent to client');
    }
  }
}

/**
 * Thêm client WebSocket
 */
function addWSClient(client) {
  const before = global.wsClients.size;
  global.wsClients.add(client);
  const after = global.wsClients.size;
  console.log('➕ Client added. Before:', before, 'After:', after);
}

/**
 * Xóa client WebSocket
 */
function removeWSClient(client) {
  const before = global.wsClients.size;
  global.wsClients.delete(client);
  const after = global.wsClients.size;
  console.log('➖ Client removed. Before:', before, 'After:', after);
}

/**
 * Lấy số lượng client
 */
function getWSClientCount() {
  const count = global.wsClients.size;
  console.log('🔍 [monitoring] getWSClientCount called, returning:', count);
  console.log('🔍 [monitoring] wsClients contents:', Array.from(global.wsClients));
  return count;
}

module.exports = {
  logEvent,
  broadcast,
  addWSClient,
  removeWSClient,
  getWSClientCount,
  wsClients: global.wsClients
};