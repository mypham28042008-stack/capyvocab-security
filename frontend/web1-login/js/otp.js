// otp.js - Hỗ trợ OTP modal
let otpTimerInterval = null;
let otpTimeout = 300;

function showOTPModal(username, fingerprint) {
  console.log('🔐 showOTPModal called with:', username);
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
    console.error('❌ OTP modal not found!');
    // Fallback dùng prompt
    const otp = prompt('Nhap ma OTP tu email (xem tai http://localhost:3002):');
    if (otp && otp.length === 6) {
      if (typeof window.verifyOTPFromLogin === 'function') {
        window.verifyOTPFromLogin(otp);
      }
    }
  }
}

function hideOTPModal() {
  const modal = document.getElementById('otpModal');
  if (modal) {
    modal.classList.add('hidden');
  }
  if (otpTimerInterval) {
    clearInterval(otpTimerInterval);
    otpTimerInterval = null;
  }
}

function startOTPTimer() {
  let timeLeft = otpTimeout;
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

// Expose ra global
window.showOTPModal = showOTPModal;
window.hideOTPModal = hideOTPModal;
window.startOTPTimer = startOTPTimer;

console.log('✅ otp.js loaded successfully!');