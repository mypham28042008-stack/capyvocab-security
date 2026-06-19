document.addEventListener('DOMContentLoaded', function() {
  let attackChart = null;
  let eventChart = null;

  // ===== ATTACK CHART =====
  async function initAttackChart() {
    try {
      const response = await fetch('/api/dashboard/event-stats');
      const data = await response.json();
      
      if (!data.success) return;
      
      // Prepare data
      const labels = data.stats.map(s => s.event_type || 'Unknown');
      const values = data.stats.map(s => s.count || 0);
      
      const ctx = document.getElementById('attackChart').getContext('2d');
      
      if (attackChart) {
        attackChart.destroy();
      }
      
      attackChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Số lượng sự kiện',
            data: values,
            backgroundColor: [
              '#667eea', '#764ba2', '#f44336', '#ff9800', 
              '#4CAF50', '#2196F3', '#9C27B0', '#FF5722'
            ],
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error loading attack chart:', error);
    }
  }

  // ===== EVENT CHART (Pie) =====
  async function initEventChart() {
    try {
      const response = await fetch('/api/dashboard/event-stats');
      const data = await response.json();
      
      if (!data.success) return;
      
      // Filter only blocked events
      const blockedEvents = data.stats.filter(s => 
        s.event_type.includes('blocked') || 
        s.event_type.includes('Blocked')
      );
      
      if (blockedEvents.length === 0) {
        document.getElementById('eventChart').parentElement.innerHTML = 
          '<div style="text-align:center;color:var(--text-light);padding:20px;">Chưa có dữ liệu</div>';
        return;
      }
      
      const labels = blockedEvents.map(s => s.event_type.replace('_blocked', '').replace('_Blocked', ''));
      const values = blockedEvents.map(s => s.count || 0);
      
      const ctx = document.getElementById('eventChart').getContext('2d');
      
      if (eventChart) {
        eventChart.destroy();
      }
      
      const colors = ['#f44336', '#ff9800', '#ff5722', '#e91e63', '#9C27B0'];
      
      eventChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 10,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error loading event chart:', error);
    }
  }

  // ===== UPDATE CHARTS =====
  async function updateCharts() {
    await initAttackChart();
    await initEventChart();
  }

  // ===== INIT =====
  // Delay to ensure DOM is ready
  setTimeout(updateCharts, 500);
  
  // Update charts every 30 seconds
  setInterval(updateCharts, 30000);
  
  // Export for manual refresh
  window.updateCharts = updateCharts;
});