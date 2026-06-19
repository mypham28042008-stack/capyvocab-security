const AuthService = require('../services/auth-service');
const OTPService = require('../services/otp-service');
const { logEvent } = require('../services/monitoring-service');

class AuthController {
  static async register(req, res) {
    try {
      const { username, password, email, role } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          error: 'Missing data',
          message: 'Username and password are required'
        });
      }
      
      const result = await AuthService.register({ username, password, email, role });
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: result
      });
    } catch (error) {
      return res.status(400).json({
        error: 'Registration failed',
        message: error.message
      });
    }
  }

  static async login(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          error: 'Missing credentials',
          message: 'Username and password are required'
        });
      }
      
      const result = await AuthService.login({ username, password, req });
      
      if (result.requireOTP) {
        return res.status(202).json({
          success: result.success,
          requireOTP: result.requireOTP,
          username: result.username,
          fingerprint: result.fingerprint,
          role: result.role || 'user',
          message: result.message
        });
      }
      
      return res.json({
        success: result.success,
        token: result.token,
        username: result.username,
        fingerprint: result.fingerprint,
        isTrusted: result.isTrusted,
        role: result.role || 'user',
        message: result.message
      });
      
    } catch (error) {
      await logEvent('login_error', 'medium', req.ip, req.body.username, error.message);
      return res.status(401).json({
        error: 'Authentication failed',
        message: error.message
      });
    }
  }
  
  static async verifyOTP(req, res) {
    try {
      const { username, otp, fingerprint } = req.body;
      
      if (!username || !otp) {
        return res.status(400).json({
          error: 'Missing data',
          message: 'Username and OTP are required'
        });
      }
      
      const result = await OTPService.verifyOTP(username, otp);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      const User = require('../models/User');
      const { sessions } = require('../defense-layers/layer4-session-binding');
      const crypto = require('crypto');
      
      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(400).json({
          error: 'User not found',
          message: 'User not found'
        });
      }
      
      const token = crypto.randomBytes(32).toString('hex');
      const sessionData = {
        username: username,
        fingerprint: fingerprint || '',
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        role: user.role || 'user',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000
      };
      sessions.set(token, sessionData);
      
      await User.updateTrustedDevice(username, true);
      
      const LoginHistory = require('../models/LoginHistory');
      await LoginHistory.create({
        username,
        ip: req.ip || req.connection.remoteAddress,
        subnet: '0.0.0.0/0',
        userAgent: req.headers['user-agent'] || '',
        fingerprint: fingerprint || '',
        success: 1,
        riskScore: 0
      });
      
      return res.json({
        success: true,
        token: token,
        role: user.role || 'user',
        message: 'OTP verified successfully'
      });
      
    } catch (error) {
      console.error('OTP verification error:', error);
      return res.status(500).json({
        error: 'OTP verification failed',
        message: error.message
      });
    }
  }
  
  static async logout(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1] || req.cookies?.sessionToken;
      const result = AuthService.logout(token);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        error: 'Logout failed',
        message: error.message
      });
    }
  }
  
  static async checkSession(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1] || req.cookies?.sessionToken;
      
      if (!token) {
        return res.status(401).json({ authenticated: false });
      }
      
      const session = await AuthService.authenticate(token);
      return res.json({
        authenticated: true,
        username: session.username,
        fingerprint: session.fingerprint,
        role: session.role || 'user'
      });
      
    } catch (error) {
      return res.status(401).json({
        authenticated: false,
        message: error.message
      });
    }
  }

  static async resendOTP(req, res) {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({
          error: 'Missing username',
          message: 'Username is required'
        });
      }
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Math.floor(Date.now() / 1000) + 600;
      
      const OTPCode = require('../models/OTPCode');
      await OTPCode.deleteByUsername(username);
      await OTPCode.create({ username, otp, expiresAt });
      
      const { sendOTP } = require('../services/email-service');
      await sendOTP(username, otp);
      
      return res.json({
        success: true,
        message: 'OTP resent successfully'
      });
      
    } catch (error) {
      console.error('Resend OTP error:', error);
      return res.status(500).json({
        error: 'Resend OTP failed',
        message: error.message
      });
    }
  }
}

module.exports = AuthController;