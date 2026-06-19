document.addEventListener('DOMContentLoaded', function() {
  const runBtn = document.getElementById('runAllAttacks');
  const statusEl = document.getElementById('attackStatus');
  const resultsEl = document.getElementById('attackResults');

  runBtn?.addEventListener('click', async function() {
    this.disabled = true;
    this.textContent = '⏳ Đang chạy...';
    statusEl.textContent = 'Đang chạy tấn công...';
    statusEl.style.color = '#ff9800';
    
    resultsEl.innerHTML = '<div class="attack-placeholder">Đang chạy các script tấn công...</div>';
    
    try {
      const response = await fetch('http://localhost:3000/api/test/attack-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success && data.results) {
        renderAttackResults(data.results);
        const passed = data.results.filter(r => r.passed).length;
        const total = data.results.length;
        statusEl.textContent = `✅ Hoàn thành: ${passed}/${total} PASS`;
        statusEl.style.color = passed === total ? '#4CAF50' : '#f44336';
      } else {
        resultsEl.innerHTML = `<div class="attack-placeholder">❌ Lỗi: ${data.message || 'Không thể chạy tấn công'}</div>`;
        statusEl.textContent = '❌ Lỗi';
        statusEl.style.color = '#f44336';
      }
    } catch (error) {
      resultsEl.innerHTML = `<div class="attack-placeholder">❌ Lỗi kết nối: ${error.message}</div>`;
      statusEl.textContent = '❌ Lỗi kết nối';
      statusEl.style.color = '#f44336';
    } finally {
      this.disabled = false;
      this.textContent = '🚀 Chạy tất cả';
    }
  });

  function renderAttackResults(results) {
    if (!results || results.length === 0) {
      resultsEl.innerHTML = '<div class="attack-placeholder">Không có kết quả</div>';
      return;
    }
    
    resultsEl.innerHTML = results.map(result => {
      const passed = result.passed;
      const icon = passed ? '✅' : '❌';
      const statusText = passed ? 'PASS' : 'FAIL';
      const statusClass = passed ? 'pass' : 'fail';
      
      let details = '';
      if (result.details) {
        if (Array.isArray(result.details)) {
          details = result.details.map(d => 
            `${d.test || d.pattern || d.attempt || ''}: ${d.blocked ? '✅' : '❌'}`
          ).join(' | ');
        } else if (typeof result.details === 'object') {
          details = JSON.stringify(result.details).substring(0, 100);
        }
      }
      
      return `
        <div class="attack-result-item ${statusClass}">
          <span class="result-icon">${icon}</span>
          <span class="result-name">${result.name || 'Unknown'}</span>
          <span class="result-status ${statusClass}">${statusText}</span>
          ${details ? `<span style="font-size:12px;color:var(--text-light)">${details}</span>` : ''}
          ${result.message ? `<span style="font-size:12px;color:var(--text-light)">${result.message}</span>` : ''}
        </div>
      `;
    }).join('');
  }

  // Chạy attack khi click vào tab
  document.querySelector('[data-tab="attacks"]')?.addEventListener('click', function() {
    // Pre-fill with demo data if no results
    if (resultsEl.querySelector('.attack-placeholder') && !resultsEl.querySelector('.attack-result-item')) {
      resultsEl.innerHTML = `
        <div class="attack-placeholder">
          <p>Nhấn "Chạy tất cả" để bắt đầu kiểm thử</p>
          <p style="font-size:12px;color:var(--text-light);margin-top:8px;">Sẽ kiểm tra 8 loại tấn công</p>
        </div>
      `;
    }
  });
});