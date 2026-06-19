document.addEventListener('DOMContentLoaded', function() {
  let ws = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;
  const reconnectDelay = 3000;

  function connectWebSocket() {
    const wsUrl = 'ws://localhost:3000/ws';
    console.log('🔌 Dashboard WebSocket connecting:', wsUrl);
    
    try {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = function() {
        console.log('🔌 Dashboard WebSocket connected');
        updateWSStatus('connected');
        reconnectAttempts = 0;
      };
      
      ws.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('WebSocket parse error:', error);
        }
      };
      
      ws.onclose = function() {
        console.log('🔌 Dashboard WebSocket disconnected');
        updateWSStatus('disconnected');
        attemptReconnect();
      };
      
      ws.onerror = function(error) {
        console.error('Dashboard WebSocket error:', error);
        updateWSStatus('disconnected');
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      updateWSStatus('disconnected');
      attemptReconnect();
    }
  }

  function attemptReconnect() {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log('🔄 Reconnecting... Attempt ' + reconnectAttempts + '/' + maxReconnectAttempts);
      setTimeout(connectWebSocket, reconnectDelay * reconnectAttempts);
    } else {
      console.log('❌ Max reconnect attempts reached');
      updateWSStatus('disconnected');
    }
  }

  function updateWSStatus(status) {
    const dot = document.querySelector('.ws-dot');
    const text = document.querySelector('.ws-text');
    
    if (dot) {
      dot.className = 'ws-dot';
      if (status === 'connected') {
        dot.classList.add('connected');
      } else {
        dot.classList.add('disconnected');
      }
    }
    
    if (text) {
      text.textContent = status === 'connected' ? 'Connected' : 'Disconnected';
    }
  }

  function handleWebSocketMessage(data) {
    console.log('📨 Dashboard WebSocket message:', data);
    
    switch (data.type) {
      case 'connection':
        break;
      case 'blocked':
      case 'warning':
      case 'security_event':
        if (typeof addEventToContainer === 'function') {
          addEventToContainer(data);
        }
        break;
      case 'new_email':
        if (typeof showEmailNotification === 'function') {
          showEmailNotification(data.email);
        }
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  connectWebSocket();
  
  // Export for reconnection
  window.reconnectWebSocket = connectWebSocket;
});
