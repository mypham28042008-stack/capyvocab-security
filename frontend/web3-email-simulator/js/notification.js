document.addEventListener('DOMContentLoaded', function() {
  // ===== PUSH NOTIFICATION SUPPORT =====
  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // Request permission on load
  requestNotificationPermission();

  // ===== SOUND NOTIFICATIONS =====
  window.playNotificationSound = function() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.1);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (error) {
      // Silently fail
    }
  };

  // ===== VISUAL NOTIFICATION =====
  window.showNotification = function(message) {
    // Web notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('📧 Gmail Simulator', {
        body: message,
        icon: '/assets/logo.png',
        silent: true
      });
    }
    
    // Also show in page (toast)
    showToast(message);
  };

  function showToast(message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
      <div class="toast-icon">📧</div>
      <div class="toast-message">${message}</div>
      <button class="toast-close">×</button>
    `;
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 1000;
      max-width: 400px;
      animation: slideUp 0.3s ease;
      border: 1px solid var(--border-color);
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideDown {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(20px); }
      }
    `;
    document.head.appendChild(style);
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: var(--text-secondary);
      padding: 0 4px;
    `;
    closeBtn.addEventListener('click', () => toast.remove());
    
    document.body.appendChild(toast);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  // ===== FAVICON BADGE =====
  function updateFaviconBadge(count) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // Draw favicon background
    ctx.fillStyle = '#EA4335';
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw count
    if (count > 0) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(count > 9 ? '9+' : count, 16, 16);
    }
    
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = canvas.toDataURL('image/x-icon');
    document.head.appendChild(link);
  }

  // ===== EXPOSE FUNCTIONS =====
  window.requestNotificationPermission = requestNotificationPermission;
  window.updateFaviconBadge = updateFaviconBadge;
});