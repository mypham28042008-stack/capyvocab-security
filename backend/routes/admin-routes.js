const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin-controller');

// BỎ TẤT CẢ AUTH - Dashboard mở tự do
// const { authMiddleware, adminMiddleware } = require('../middleware/auth');
// const { insiderGuardMiddleware } = require('../defense-layers/layer6-insider-guard');

// router.use(authMiddleware);
// router.use(adminMiddleware);

router.get('/api/admin/users', AdminController.getUsers);
router.get('/api/admin/users/:username', AdminController.getUserDetails);
router.post('/api/admin/users/lock', AdminController.lockAccount);
router.post('/api/admin/users/unlock', AdminController.unlockAccount);
router.get('/api/admin/config', AdminController.getConfig);
router.put('/api/admin/config', AdminController.updateConfig);
router.get('/api/admin/stats', AdminController.getSecurityStats);
router.get('/api/admin/events', AdminController.getRecentEvents);

module.exports = router;