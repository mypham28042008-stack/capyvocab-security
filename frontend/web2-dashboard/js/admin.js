document.addEventListener('DOMContentLoaded', function() {
  // ===== LOAD USERS =====
  async function loadUsers() {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-text">Đang tải...</td></tr>';
    
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success && data.users) {
        tbody.innerHTML = data.users.map(user => `
          <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email || '—'}</td>
            <td>${user.role || 'user'}</td>
            <td class="${user.is_trusted_device ? 'trusted-yes' : 'trusted-no'}">
              ${user.is_trusted_device ? '✅ Yes' : '❌ No'}
            </td>
            <td>
              ${user.username !== 'admin' ? `
                <button class="btn-lock" data-username="${user.username}">Khóa</button>
                <button class="btn-unlock" data-username="${user.username}">Mở khóa</button>
              ` : '—'}
            </td>
          </tr>
        `).join('');
        
        // Add event listeners for lock/unlock buttons
        document.querySelectorAll('.btn-lock').forEach(btn => {
          btn.addEventListener('click', () => lockUser(btn.dataset.username));
        });
        document.querySelectorAll('.btn-unlock').forEach(btn => {
          btn.addEventListener('click', () => unlockUser(btn.dataset.username));
        });
      }
    } catch (error) {
      tbody.innerHTML = '<tr><td colspan="6" class="loading-text">Lỗi tải dữ liệu</td></tr>';
      console.error('Error loading users:', error);
    }
  }

  // ===== LOCK USER =====
  async function lockUser(username) {
    if (!confirm(`Khóa tài khoản ${username}?`)) return;
    
    try {
      const response = await fetch('/api/admin/users/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, reason: 'Locked by admin' })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`✅ Đã khóa tài khoản ${username}`);
        loadUsers();
      } else {
        alert(`❌ Lỗi: ${data.error || 'Không thể khóa tài khoản'}`);
      }
    } catch (error) {
      alert('❌ Lỗi kết nối');
      console.error(error);
    }
  }

  // ===== UNLOCK USER =====
  async function unlockUser(username) {
    if (!confirm(`Mở khóa tài khoản ${username}?`)) return;
    
    try {
      const response = await fetch('/api/admin/users/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`✅ Đã mở khóa tài khoản ${username}`);
        loadUsers();
      } else {
        alert(`❌ Lỗi: ${data.error || 'Không thể mở khóa tài khoản'}`);
      }
    } catch (error) {
      alert('❌ Lỗi kết nối');
      console.error(error);
    }
  }

  // ===== LOAD SECURITY STATS =====
  async function loadSecurityStats() {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      
      if (data.success && data.stats) {
        document.getElementById('stat-total-events').textContent = data.stats.totalEvents || 0;
        document.getElementById('stat-blocked').textContent = data.stats.blockedAttempts || 0;
        document.getElementById('stat-critical').textContent = data.stats.criticalEvents || 0;
        
        // Calculate specific stats
        const rateLimit = data.stats.stats?.find(s => s.event_type === 'rate_limit_blocked');
        const webshell = data.stats.stats?.find(s => s.event_type === 'webshell_blocked');
        
        document.getElementById('stat-rate-limit').textContent = rateLimit ? rateLimit.count : 0;
        document.getElementById('stat-webshell').textContent = webshell ? webshell.count : 0;
      }
    } catch (error) {
      console.error('Error loading security stats:', error);
    }
  }

  // ===== SAVE CONFIG =====
  document.getElementById('saveConfig')?.addEventListener('click', async function() {
    const configs = {
      'rate_limit_attempts': document.getElementById('cfg-rate-limit').value,
      'rate_limit_window_seconds': document.getElementById('cfg-rate-window').value,
      'rate_limit_block_seconds': document.getElementById('cfg-rate-block').value,
      'otp_max_failures': document.getElementById('cfg-otp-failures').value,
      'otp_block_seconds': document.getElementById('cfg-otp-block').value,
      'trusted_device_threshold': document.getElementById('cfg-trusted').value
    };
    
    this.disabled = true;
    this.textContent = 'Đang lưu...';
    
    let success = true;
    for (const [key, value] of Object.entries(configs)) {
      try {
        const response = await fetch('/api/admin/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value })
        });
        if (!response.ok) success = false;
      } catch (error) {
        success = false;
        console.error(`Error saving ${key}:`, error);
      }
    }
    
    this.disabled = false;
    this.textContent = '💾 Lưu cấu hình';
    
    if (success) {
      alert('✅ Cấu hình đã được lưu');
    } else {
      alert('❌ Có lỗi khi lưu cấu hình');
    }
  });

  // ===== LOG FILTER =====
  document.getElementById('logFilter')?.addEventListener('change', function() {
    window.refreshLogs();
  });

  document.getElementById('refreshLogs')?.addEventListener('click', function() {
    window.refreshLogs();
  });

  // ===== INIT =====
  loadUsers();
  loadSecurityStats();
  
  // Refresh periodically
  setInterval(() => {
    loadUsers();
    loadSecurityStats();
  }, 30000);
});