const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth-controller');
const { rateLimitMiddleware } = require('../defense-layers/layer0-rate-limit');
const { httpsEnforcerMiddleware } = require('../defense-layers/layer1-https-enforcer');
const { webshellBlockerMiddleware } = require('../defense-layers/layer2-webshell-blocker');
const { verifyAppIntegrityMiddleware } = require('../defense-layers/layer3-otp-app');
const { authBypassDetectorMiddleware } = require('../defense-layers/layer5-auth-bypass');
const { validateSessionMiddleware } = require('../defense-layers/layer4-session-binding');

// Route đăng ký
router.post('/api/register', AuthController.register);

// Route đăng nhập - Áp dụng TẤT CẢ các tầng
router.post(
  '/api/login',
  rateLimitMiddleware,
  httpsEnforcerMiddleware,
  webshellBlockerMiddleware,
  verifyAppIntegrityMiddleware,
  authBypassDetectorMiddleware,
  AuthController.login
);

// Route xác thực OTP
router.post('/api/verify-otp', AuthController.verifyOTP);

// Route gửi lại OTP - THÊM DÒNG NÀY
router.post('/api/resend-otp', AuthController.resendOTP);

// Route đăng xuất
router.post('/api/logout', validateSessionMiddleware, AuthController.logout);

// Route kiểm tra session
router.get('/api/session', validateSessionMiddleware, AuthController.checkSession);

module.exports = router;