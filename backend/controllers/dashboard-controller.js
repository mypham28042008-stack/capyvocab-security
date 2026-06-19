const SecurityEvent = require('../models/SecurityEvent');
const LoginHistory = require('../models/LoginHistory');

class DashboardController {
  static async getStats(req, res) {
    try {
      const events = await SecurityEvent.getRecent(1000);
      const totalRequests = events.length;
      const blockedAttempts = events.filter(e => e.event_type && e.event_type.includes('blocked')).length;
      const criticalEvents = events.filter(e => e.severity === 'critical').length;
      
      // === LẤY TRỰC TIẾP TỪ GLOBAL ===
      let wsCount = 0;
      if (global.wsClients) {
        wsCount = global.wsClients.size;
      }
      console.log('📊 [DEBUG] wsCount from global:', wsCount);
      
      res.json({
        success: true,
        stats: {
          totalRequests: totalRequests || 0,
          blockedAttempts: blockedAttempts || 0,
          criticalEvents: criticalEvents || 0,
          wsConnections: wsCount || 0
        }
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
  
  static async getRecentEvents(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const events = await SecurityEvent.getRecent(limit);
      res.json({ success: true, events: events || [] });
    } catch (error) {
      console.error('Events error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
  
  static async getEventStats(req, res) {
    try {
      const stats = await SecurityEvent.getStats();
      res.json({ success: true, stats: stats || [] });
    } catch (error) {
      console.error('Event stats error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
  
  static async getTopBlockedIPs(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const events = await SecurityEvent.getRecent(1000);
      const blockedEvents = events.filter(e => e.event_type && e.event_type.includes('blocked'));
      
      const ipCount = {};
      blockedEvents.forEach(e => {
        if (e.ip) {
          ipCount[e.ip] = (ipCount[e.ip] || 0) + 1;
        }
      });
      
      const topIPs = Object.entries(ipCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([ip, count]) => ({ ip, count }));
      
      res.json({ success: true, topIPs: topIPs || [] });
    } catch (error) {
      console.error('Top IPs error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

module.exports = DashboardController;