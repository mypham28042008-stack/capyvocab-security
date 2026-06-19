document.addEventListener('DOMContentLoaded', function() {
  let emails = [];
  let selectedEmailId = null;

  async function loadInbox() {
    try {
      const response = await fetch('/api/email/inbox');
      const data = await response.json();
      
      if (data.success && data.inbox) {
        const newEmails = data.inbox;
        if (newEmails.length !== emails.length) {
          console.log('📧 New emails detected! Reloading...');
          emails = newEmails;
          renderEmailList(emails);
          updateCounts(emails);
        }
      }
    } catch (error) {
      console.error('Error loading inbox:', error);
    }
  }

  function renderEmailList(emails) {
    const container = document.getElementById('emailList');
    
    if (!emails || emails.length === 0) {
      container.innerHTML = `
        <div class="email-placeholder">
          <svg width="48" height="48"><use href="/sprite.svg#icon-inbox"></use></svg>
          <p>Hộp thư trống</p>
          <span>Chưa có email nào</span>
        </div>
      `;
      return;
    }
    
    const sorted = [...emails].reverse();
    
    container.innerHTML = sorted.map((email) => {
      const isUnread = !email.read;
      const time = new Date(email.timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const hasOTP = email.otp;
      const otpBadge = hasOTP ? `<span class="otp-badge">🔐 ${email.otp}</span>` : '';
      
      return `
        <div class="email-item ${isUnread ? 'unread' : ''}" data-id="${email.id}" onclick="selectEmail(${email.id})">
          <span class="email-from">${email.from || 'security@capyvocab.com'}</span>
          <span class="email-subject">${email.subject || 'Email'}</span>
          ${otpBadge}
          <span class="email-time">${time}</span>
        </div>
      `;
    }).join('');
  }

  function updateCounts(emails) {
    const count = emails.length;
    const unread = emails.filter(e => !e.read).length;
    document.getElementById('emailCount').textContent = count + ' emails';
    document.getElementById('unreadCount').textContent = unread;
  }

  window.selectEmail = function(id) {
    selectedEmailId = id;
    
    document.querySelectorAll('.email-item').forEach(el => {
      el.classList.toggle('selected', parseInt(el.dataset.id) === id);
    });
    
    showEmailDetail(id);
    
    const email = emails.find(e => e.id === id);
    if (email) {
      email.read = true;
      renderEmailList(emails);
      updateCounts(emails);
    }
  };

  function showEmailDetail(id) {
    const container = document.getElementById('emailDetail');
    const email = emails.find(e => e.id === id);
    
    if (!email) {
      container.innerHTML = `
        <div class="detail-placeholder">
          <svg width="48" height="48"><use href="/sprite.svg#icon-email"></use></svg>
          <p>Email không tồn tại</p>
        </div>
      `;
      return;
    }
    
    const time = new Date(email.timestamp).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const otpHTML = email.otp ? `
      <div style="text-align:center;margin:16px 0;">
        <span style="font-size:14px;color:var(--text-secondary);">Mã OTP của bạn:</span>
        <div class="otp-code">${email.otp}</div>
        <span style="font-size:12px;color:var(--text-light);">Mã có hiệu lực trong 5 phút</span>
      </div>
    ` : '';
    
    container.innerHTML = `
      <div class="detail-header">
        <div class="detail-from">📧 Từ: ${email.from || 'security@capyvocab.com'}</div>
        <div class="detail-subject">${email.subject || 'Email'}</div>
        <div class="detail-meta">📅 ${time}</div>
      </div>
      <div class="detail-body">
        ${email.body || 'Không có nội dung'}
        ${otpHTML}
      </div>
    `;
  }

  // Xóa tất cả email
  document.getElementById('deleteAll')?.addEventListener('click', async function() {
    if (!confirm('Xóa tất cả email?')) return;
    try {
      await fetch('/api/email/all', { method: 'DELETE' });
      emails = [];
      renderEmailList(emails);
      updateCounts(emails);
      document.getElementById('emailDetail').innerHTML = `
        <div class="detail-placeholder">
          <svg width="48" height="48"><use href="/sprite.svg#icon-email"></use></svg>
          <p>Hộp thư trống</p>
        </div>
      `;
    } catch (error) {
      console.error('Error deleting emails:', error);
    }
  });

  // Load inbox lần đầu
  loadInbox();
  
  // Auto refresh mỗi 3 giây
  setInterval(loadInbox, 3000);
  
  // Refresh button
  document.getElementById('refreshInbox')?.addEventListener('click', loadInbox);
});