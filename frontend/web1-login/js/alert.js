// Global alert functions for all pages

function showAlert(message, type = 'info', duration = 5000) {
  const container = document.getElementById('alertContainer');
  if (!container) {
    console.warn('Alert container not found');
    return;
  }
  
  const types = {
    info: { icon: 'ℹ️', className: 'alert-info' },
    success: { icon: '✅', className: 'alert-success' },
    error: { icon: '❌', className: 'alert-error' },
    warning: { icon: '⚠️', className: 'alert-warning' }
  };
  
  const config = types[type] || types.info;
  
  const alertEl = document.createElement('div');
  alertEl.className = `alert ${config.className}`;
  alertEl.innerHTML = `
    <span>${config.icon}</span>
    <span>${message}</span>
    <button class="alert-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.appendChild(alertEl);
  
  if (duration > 0) {
    setTimeout(() => {
      if (alertEl.parentElement) {
        alertEl.remove();
      }
    }, duration);
  }
}

// Close alert by clicking
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('alert-close')) {
    e.target.parentElement.remove();
  }
});