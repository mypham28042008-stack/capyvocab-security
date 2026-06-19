const User = require('../models/User');
const Config = require('../models/Config');
const SecurityEvent = require('../models/SecurityEvent');
const LoginHistory = require('../models/LoginHistory');

class AdminService {
  static async getAllUsers() {
    try {
      const users = await User.getAll();
      return users || [];
    } catch (error) {
      console.error('❌ Error in getAllUsers:', error.message);
      return [];
    }
  }
  
  static async getUserDetails(username) {
    try {
      const user = await User.findByUsername(username);
      if (!user) return null;
      const history = await LoginHistory.getHistoryByUsername(username);
      return { user, history };
    } catch (error) {
      console.error('❌ Error in getUserDetails:', error.message);
      return null;
    }
  }
  
  static async updateConfig(key, value) {
    try {
      return await Config.set(key, value);
    } catch (error) {
      console.error('❌ Error in updateConfig:', error.message);
      return null;
    }
  }
  
  static async getAllConfig() {
    try {
      return await Config.getAll();
    } catch (error) {
      console.error('❌ Error in getAllConfig:', error.message);
      return {};
    }
  }
  
  static async getSecurityStats() {
    try {
      const stats = await SecurityEvent.getStats();
      if (!stats || !Array.isArray(stats)) {
        return { totalEvents: 0, stats: [], blockedAttempts: 0, criticalEvents: 0 };
      }
      const totalEvents = stats.reduce((sum, s) => sum + (s.count || 0), 0);
      return {
        totalEvents,
        stats,
        blockedAttempts: stats.filter(s => s.event_type && s.event_type.includes('blocked')).reduce((sum, s) => sum + (s.count || 0), 0),
        criticalEvents: stats.filter(s => s.severity === 'critical').reduce((sum, s) => sum + (s.count || 0), 0)
      };
    } catch (error) {
      console.error('❌ Error in getSecurityStats:', error.message);
      return { totalEvents: 0, stats: [], blockedAttempts: 0, criticalEvents: 0 };
    }
  }
  
  static async getRecentEvents(limit = 50) {
    try {
      return await SecurityEvent.getRecent(limit);
    } catch (error) {
      console.error('❌ Error in getRecentEvents:', error.message);
      return [];
    }
  }
  
  static async lockAccount(username, reason) {
    try {
      return await User.lockAccount(username, reason);
    } catch (error) {
      console.error('❌ Error in lockAccount:', error.message);
      return null;
    }
  }
  
  static async unlockAccount(username) {
    try {
      return await User.unlockAccount(username);
    } catch (error) {
      console.error('❌ Error in unlockAccount:', error.message);
      return null;
    }
  }
}

module.exports = AdminService;