const AdminService = require('../services/admin-service');
const { logEvent } = require('../services/monitoring-service');

class AdminController {
  static async getUsers(req, res) {
    try {
      const users = await AdminService.getAllUsers();
      res.json({ success: true, users: users || [] });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  static async getUserDetails(req, res) {
    try {
      const { username } = req.params;
      const details = await AdminService.getUserDetails(username);
      
      if (!details) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      res.json({ success: true, ...details });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  static async updateConfig(req, res) {
    try {
      const { key, value } = req.body;
      
      if (!key || value === undefined) {
        return res.status(400).json({ success: false, error: 'Key and value are required' });
      }
      
      await AdminService.updateConfig(key, value);
      
      await logEvent('config_updated', 'medium', req.ip, req.user?.username, `Config ${key} = ${value}`);
      
      res.json({ success: true, key, value });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  static async getConfig(req, res) {
    try {
      const config = await AdminService.getAllConfig();
      res.json({ success: true, config: config || {} });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  static async getSecurityStats(req, res) {
    try {
      const stats = await AdminService.getSecurityStats();
      res.json({ success: true, stats: stats || {} });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  static async getRecentEvents(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const events = await AdminService.getRecentEvents(limit);
      res.json({ success: true, events: events || [] });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  static async lockAccount(req, res) {
    try {
      const { username, reason } = req.body;
      
      if (!username) {
        return res.status(400).json({ success: false, error: 'Username is required' });
      }
      
      const result = await AdminService.lockAccount(username, reason || 'No reason provided');
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  static async unlockAccount(req, res) {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ success: false, error: 'Username is required' });
      }
      
      const result = await AdminService.unlockAccount(username);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = AdminController;