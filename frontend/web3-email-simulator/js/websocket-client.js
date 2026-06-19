document.addEventListener('DOMContentLoaded', function() {
  let ws = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;

  function connectWebSocket() {
    // WebSocket đang chạy trên port 3000 (Main Server)
    const wsUrl = 'ws://localhost:3000/ws';
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    
    try {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = function() {
        console.log('✅ Email WebSocket connected');
        updateWSStatus('connected');
        reconnectAttempts = 0;
      };
      
      ws.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Email WebSocket message:', data);
          if (data.type === 'new_email' && data.email) {
            console.log('📧 New email received!');
            if (typeof window.addNewEmail === 'function') {
              window.addNewEmail(data.email);
            } else {
              console.log('⚠️ addNewEmail not defined, reloading...');
              location.reload();
            }
          }
        } catch (error) {
          console.error('WebSocket parse error:', error);
        }
      };
      
      ws.onclose = function() {
        console.log('❌ Email WebSocket disconnected');
        updateWSStatus('disconnected');
        attemptReconnect();
      };
      
      ws.onerror = function(error) {
        console.error('❌ Email WebSocket error:', error);
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
      setTimeout(connectWebSocket, 3000 * reconnectAttempts);
    }
  }

  function updateWSStatus(status) {
    const dot = document.getElementById('wsDot');
    const text = document.getElementById('wsStatusText');
    
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

  connectWebSocket();
});
