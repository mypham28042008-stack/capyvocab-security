document.addEventListener('DOMContentLoaded', function() {
  // ===== RESPONSIVE: Close detail on mobile =====
  const detailEl = document.getElementById('emailDetail');
  
  // Add close button for mobile
  if (window.innerWidth <= 768) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'detail-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      position: sticky;
      top: 0;
      float: right;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--text-secondary);
      padding: 8px;
      z-index: 10;
    `;
    closeBtn.addEventListener('click', function() {
      detailEl.classList.remove('active');
    });
    detailEl.prepend(closeBtn);
  }

  // ===== KEYBOARD SHORTCUTS =====
  document.addEventListener('keydown', function(e) {
    // ESC to close detail
    if (e.key === 'Escape') {
      detailEl.classList.remove('active');
    }
    
    // 'r' to refresh
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
      document.getElementById('refreshInbox')?.click();
    }
  });
});