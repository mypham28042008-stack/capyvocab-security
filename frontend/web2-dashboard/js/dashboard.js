document.addEventListener('DOMContentLoaded', function() {
  // ===== BỎ CHECK AUTH - Dashboard mở tự do =====
  // KHÔNG CẦN checkAuth() NỮA

  // ===== TIME =====
  function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    document.getElementById('headerTime').textContent = timeStr;
  }
  updateTime();
  setInterval(updateTime, 1000);

  // ===== TAB SWITCHING =====
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = {
    dashboard: document.getElementById('tab-dashboard'),
    admin: document.getElementById('tab-admin'),
    logs: document.getElementById('tab-logs'),
    attacks: document.getElementById('tab-attacks')
  };
  
  const pageTitles = {
    dashboard: '📊 Security Dashboard',
    admin: '⚙️ Admin Panel',
    logs: '📋 Security Logs',
    attacks: '🧪 Attack Testing'
  };

  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      
      navItems.forEach(n => n.classList.remove('active'));
      this.classList.add('active');
      
      const tab = this.dataset.tab;
      Object.keys(tabContents).forEach(key => {
        tabContents[key].classList.toggle('active', key === tab);
      });
      
      document.getElementById('pageTitle').textContent = pageTitles[tab] || 'Dashboard';
      
      if (tab === 'logs') refreshLogs();
      if (tab === 'dashboard') loadDashboardData();
    });
  });

  // ===== LOAD DASHBOARD DATA =====
  async function loadDashboardData() {
    try {
      // SỬA: Gọi từ Main Server (port 3000)
      const response = await fetch('http://localhost:3000/api/dashboard/stats?t=' + Date.now());
      const data = await response.json();
      
      if (data.success) {
        console.log('📊 WS Clients from API:', data.stats.wsConnections);
        
        document.getElementById('totalRequests').textContent = data.stats.totalRequests || 0;
        document.getElementById('blockedCount').textContent = data.stats.blockedAttempts || 0;
        document.getElementById('criticalEvents').textContent = data.stats.criticalEvents || 0;
        document.getElementById('wsConnections').textContent = data.stats.wsConnections || 0;
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }

  // ===== LOAD EVENTS =====
  async function loadEvents() {
    try {
      // SỬA: Gọi từ Main Server (port 3000)
      const response = await fetch('http://localhost:3000/api/dashboard/events?limit=50');
      const data = await response.json();
      
      if (data.success) {
        renderEvents(data.events);
        document.getElementById('eventsCount').textContent = `${data.events.length} events`;
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }

  function renderEvents(events) {
    const container = document.getElementById('eventsContainer');
    
    if (!events || events.length === 0) {
      container.innerHTML = `
        <div class="event-placeholder">
          <svg width="64" height="64"><use href="/sprite.svg#icon-shield"></use></svg>
          <p>Chưa có sự kiện bảo mật</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = events.map(event => {
      const severityClass = event.severity || 'info';
      const time = new Date(event.timestamp * 1000).toLocaleTimeString('vi-VN');
      const typeLabels = {
        'rate_limit_blocked': '🚫 Rate Limit',
        'webshell_blocked': '🔴 WebShell',
        'session_hijack_detected': '🟡 Session Hijack',
        'auth_bypass_detected': '🟠 Auth Bypass',
        'login_success': '✅ Login Success',
        'login_error': '❌ Login Error',
        'otp_verified': '🔐 OTP Verified',
        'otp_blocked': '⛔ OTP Blocked'
      };
      const typeLabel = typeLabels[event.event_type] || event.event_type;
      
      return `
        <div class="event-item">
          <span class="event-time">${time}</span>
          <span class="event-severity ${severityClass}">${severityClass}</span>
          <span class="event-type">${typeLabel}</span>
          <span class="event-message">${event.details || event.username || '—'}</span>
          ${event.ip ? `<span class="event-ip" style="font-size:12px;color:var(--text-light)">${event.ip}</span>` : ''}
        </div>
      `;
    }).join('');
  }

  // ===== LOAD TOP IPs =====
  async function loadTopIPs() {
    try {
      // SỬA: Gọi từ Main Server (port 3000)
      const response = await fetch('http://localhost:3000/api/dashboard/top-blocked-ips?limit=10');
      const data = await response.json();
      
      if (data.success && data.topIPs && data.topIPs.length > 0) {
        const container = document.getElementById('topIPs');
        container.innerHTML = data.topIPs.map(ip => `
          <div class="ip-item">
            <span class="ip-address">${ip.ip}</span>
            <span class="ip-count">${ip.count} lần</span>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Error loading top IPs:', error);
    }
  }

  // ===== REFRESH LOGS =====
  window.refreshLogs = async function() {
    const container = document.getElementById('logsContainer');
    const filter = document.getElementById('logFilter')?.value || 'all';
    
    container.innerHTML = '<div class="log-placeholder">Đang tải...</div>';
    
    try {
      // SỬA: Gọi từ Main Server (port 3000)
      const url = filter === 'all' 
        ? 'http://localhost:3000/api/admin/events?limit=100'
        : 'http://localhost:3000/api/admin/events?limit=100';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.events) {
        const filtered = filter === 'all' 
          ? data.events 
          : data.events.filter(e => e.event_type === filter);
        
        if (filtered.length === 0) {
          container.innerHTML = '<div class="log-placeholder">Không có log nào</div>';
          return;
        }
        
        container.innerHTML = filtered.map(event => {
          const time = new Date(event.timestamp * 1000).toLocaleString('vi-VN');
          return `
            <div class="log-entry">
              <span class="log-time">${time}</span>
              <span class="log-severity ${event.severity || 'info'}">${event.severity || 'info'}</span>
              <span class="log-message">${event.event_type} ${event.details ? '- ' + event.details : ''}</span>
              ${event.username ? `<span style="color:var(--text-light)">@${event.username}</span>` : ''}
            </div>
          `;
        }).join('');
      }
    } catch (error) {
      container.innerHTML = '<div class="log-placeholder">Lỗi tải logs</div>';
      console.error('Error loading logs:', error);
    }
  };

  // ===== LOGOUT =====
  document.getElementById('logoutBtn').addEventListener('click', async function() {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = 'http://localhost:3000';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = 'http://localhost:3000';
    }
  });

  // ===== THEME TOGGLE =====
  document.getElementById('themeToggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  });

  // Load saved theme
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }

  // ===== LOAD DỮ LIỆU NGAY =====
  loadDashboardData();
  loadEvents();
  loadTopIPs();
  
  // Refresh every 5 seconds
  setInterval(() => {
    loadDashboardData();
    loadEvents();
  }, 5000);
});