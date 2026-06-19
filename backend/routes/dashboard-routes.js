const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard-controller');

// Dashboard routes
router.get('/api/dashboard/stats', DashboardController.getStats);
router.get('/api/dashboard/events', DashboardController.getRecentEvents);
router.get('/api/dashboard/event-stats', DashboardController.getEventStats);
router.get('/api/dashboard/top-blocked-ips', DashboardController.getTopBlockedIPs);

module.exports = router;