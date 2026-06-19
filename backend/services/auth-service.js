const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const SecurityEvent = require('../models/SecurityEvent');
const Config = require('../models/Config');
const OTPCode = require('../models/OTPCode');
const { generateFingerprint } = require('../encryption/fingerprint');
const { sessions } = require('../defense-layers/layer4-session-binding');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class AuthService {
  static async register({ username, password, email, role = 'user' }) {
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }
    
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      username,
      passwordHash,
      email,
      salt,
      role
    });
    
    return user;
  }
  
  static async login({ username, password, req }) {
    console.log('🔐 === LOGIN ATTEMPT ===');
    console.log('📝 Username:', username);
    
    const user = await User.findByUsername(username);
    if (!user) {
      console.log('❌ User not found:', username);
      throw new Error('Invalid credentials');
    }
    
    console.log('✅ User found:', username);
    console.log('👤 Role:', user.role);
    
    if (user.is_locked) {
      console.log('❌ Account locked:', username);
      throw new Error('Account is locked. Please contact admin.');
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log('🔐 Password valid:', isValid);
    
    if (!isValid) {
      console.log('❌ Password mismatch for:', username);
      await LoginHistory.create({
        username,
        ip: req.ip || 'unknown',
        subnet: '0.0.0.0/0',
        userAgent: req.headers['user-agent'] || '',
        fingerprint: generateFingerprint(req.ip || 'unknown', req.headers['user-agent'] || '', req.headers['accept-language'] || ''),
        success: 0,
        riskScore: 10
      });
      throw new Error('Invalid credentials');
    }
    
    console.log('✅ Password correct!');
    
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const fingerprint = generateFingerprint(ip, userAgent, acceptLanguage);
    
    const threshold = await Config.get('trusted_device_threshold') || 3;
    const successCount = await LoginHistory.getSuccessfulCountByFingerprint(username, fingerprint);
    const isTrusted = successCount >= threshold;
    console.log('📱 Is trusted:', isTrusted);
    
    if (!isTrusted) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Math.floor(Date.now() / 1000) + 300;
      
      await OTPCode.create({ username, otp, expiresAt });
      
      const { sendOTP } = require('./email-service');
      await sendOTP(username, otp);
      
      console.log('📧 OTP sent to:', username);
      
      return {
        success: true,
        requireOTP: true,
        username: username,
        fingerprint: fingerprint,
        role: user.role || 'user',
        message: 'OTP sent to your email'
      };
    }
    
    const token = crypto.randomBytes(32).toString('hex');
    const sessionData = {
      username,
      fingerprint,
      ip,
      userAgent,
      role: user.role || 'user',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000
    };
    sessions.set(token, sessionData);
    
    await LoginHistory.create({
      username,
      ip,
      subnet: ip.split('.').slice(0, 3).join('.') + '.0/24',
      userAgent,
      fingerprint,
      success: 1,
      riskScore: 0
    });
    
    const { broadcast } = require('./monitoring-service');
    broadcast({
      type: 'login_success',
      username: username,
      role: user.role || 'user',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Login successful for:', username, 'Role:', user.role);
    
    return {
      success: true,
      token: token,
      username: username,
      fingerprint: fingerprint,
      isTrusted: true,
      role: user.role || 'user',
      message: 'Login successful'
    };
  }
  
  static logout(token) {
    sessions.delete(token);
    return { success: true, message: 'Logout successful' };
  }
  
  static async authenticate(token) {
    if (!token) {
      throw new Error('Token required');
    }
    
    const session = sessions.get(token);
    if (!session) {
      throw new Error('Invalid session');
    }
    
    if (Date.now() > session.expiresAt) {
      sessions.delete(token);
      throw new Error('Session expired');
    }
    
    return session;
  }
}

module.exports = AuthService;