document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const btnText = loginBtn.querySelector('.btn-text');
  const btnSpinner = loginBtn.querySelector('.btn-spinner');
  const togglePassword = document.getElementById('togglePassword');
  const alertContainer = document.getElementById('alertContainer');

  // Biến lưu thông tin OTP
  let currentUsername = '';
  let currentFingerprint = '';
  let otpTimerInterval = null;

  // Toggle password visibility
  togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    const icon = togglePassword.querySelector('use');
    icon.setAttribute('href', type === 'password' ? '/sprite.svg#icon-eye-open' : '/sprite.svg#icon-eye-closed');
  });

  // Hàm hiển thị OTP modal
  window.showOTPModal = function(username, fingerprint) {
    currentUsername = username;
    currentFingerprint = fingerprint;
    
    const modal = document.getElementById('otpModal');
    if (modal) {
      modal.classList.remove('hidden');
      const input = document.getElementById('otpInput');
      if (input) {
        input.value = '';
        input.focus();
      }
      startOTPTimer();
    } else {
      // Fallback nếu không có modal
      const otp = prompt('Nhap ma OTP tu email (xem tai http://localhost:3002):');
      if (otp && otp.length === 6) {
        verifyOTP(otp);
      }
    }
  };

  window.hideOTPModal = function() {
    const modal = document.getElementById('otpModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    if (otpTimerInterval) {
      clearInterval(otpTimerInterval);
      otpTimerInterval = null;
    }
  };

  function startOTPTimer() {
    let timeLeft = 300;
    const timerEl = document.getElementById('otpTimer');
    if (!timerEl) return;
    
    if (otpTimerInterval) {
      clearInterval(otpTimerInterval);
    }
    
    otpTimerInterval = setInterval(function() {
      timeLeft--;
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerEl.textContent = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
      if (timeLeft <= 0) {
        clearInterval(otpTimerInterval);
        otpTimerInterval = null;
        timerEl.textContent = 'Het han';
        const alertEl = document.getElementById('otpAlert');
        if (alertEl) {
          alertEl.innerHTML = '<div class="alert alert-error">OTP da het han. Vui long gui lai.</div>';
        }
      }
    }, 1000);
  }

  window.startOTPTimer = startOTPTimer;

  async function verifyOTP(otp) {
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUsername,
          otp: otp,
          fingerprint: currentFingerprint
        })
      });
      
      const data = await response.json();
      console.log('Verify Response:', data);
      
      if (response.ok) {
        showAlert('Xac thuc thanh cong!', 'success');
        window.hideOTPModal();
        if (data.token) {
          localStorage.setItem('sessionToken', data.token);
          document.cookie = 'sessionToken=' + data.token + '; path=/';
        }
        console.log('🔐 Role after verify:', data.role);
        setTimeout(function() {
          // CHUYỂN HƯỚNG VỀ APP HỌC (TRANG CHỦ)
          window.location.href = 'http://localhost:3000/app';
        }, 1500);
      } else {
        showAlert(data.message || data.error || 'OTP khong hop le', 'error');
      }
    } catch (error) {
      console.error('Verify error:', error);
      showAlert('Loi ket noi. Vui long thu lai.', 'error');
    }
  }

  // Xử lý nút xác nhận OTP
  document.getElementById('verifyOtpBtn')?.addEventListener('click', function() {
    const otp = document.getElementById('otpInput').value.trim();
    if (!otp || otp.length < 6) {
      showAlert('Vui long nhap day du 6 so OTP', 'error');
      return;
    }
    verifyOTP(otp);
  });

  // Enter key cho OTP
  document.getElementById('otpInput')?.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('verifyOtpBtn').click();
    }
  });

  // Gửi lại OTP
  document.getElementById('resendOtpBtn')?.addEventListener('click', async function() {
    console.log('🔄 Resend OTP for username:', currentUsername);
    if (!currentUsername) {
      showAlert('Khong tim thay username. Vui long dang nhap lai.', 'error');
      return;
    }
    this.disabled = true;
    this.textContent = 'Dang gui...';
    try {
      const response = await fetch('/api/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUsername })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showAlert('Da gui lai OTP thanh cong!', 'success');
        startOTPTimer();
        document.getElementById('otpInput').value = '';
        document.getElementById('otpInput').focus();
      } else {
        showAlert(data.message || data.error || 'Gui lai OTP that bai', 'error');
      }
    } catch (error) {
      showAlert('Loi ket noi. Vui long thu lai.', 'error');
    } finally {
      this.disabled = false;
      this.textContent = 'Gui lai';
    }
  });

  // Submit form login
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showAlert('Vui long nhap day du ten dang nhap va mat khau', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      console.log('Login Response:', data);

      if (response.ok) {
        if (data.requireOTP) {
          currentUsername = data.username;
          currentFingerprint = data.fingerprint;
          
          // Hiển thị OTP modal
          window.showOTPModal(currentUsername, currentFingerprint);
          showAlert('Ma OTP da duoc gui den email. Vui long mo http://localhost:3002 de lay ma!', 'success');
        } else {
          showAlert('Dang nhap thanh cong!', 'success');
          if (data.token) {
            localStorage.setItem('sessionToken', data.token);
            document.cookie = 'sessionToken=' + data.token + '; path=/';
          }
          console.log('🔐 Role:', data.role);
          setTimeout(function() {
            // CHUYỂN HƯỚNG VỀ APP HỌC (TRANG CHỦ)
            // Tất cả user đều vào app học, không phân biệt role
            window.location.href = 'http://localhost:3000/app';
          }, 1500);
        }
      } else {
        showAlert(data.message || data.error || 'Dang nhap that bai', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showAlert('Loi ket noi. Vui long thu lai.', 'error');
    } finally {
      setLoading(false);
    }
  });

  function setLoading(loading) {
    loginBtn.disabled = loading;
    btnText.textContent = loading ? 'Dang xu ly...' : 'Dang nhap';
    btnSpinner.classList.toggle('hidden', !loading);
  }

  window.showAlert = function(message, type) {
    alertContainer.innerHTML = '';
    var alert = document.createElement('div');
    alert.className = 'alert alert-' + (type || 'info');
    alert.textContent = message;
    alertContainer.appendChild(alert);
    setTimeout(function() {
      if (alert.parentNode) alert.remove();
    }, 10000);
  };
});