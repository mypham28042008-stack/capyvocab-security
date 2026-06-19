const SecurityEvent = require('../models/SecurityEvent');

// Cache approval tokens
const approvalTokens = new Map();

/**
 * Giám sát hành vi admin
 */
async function insiderGuardMiddleware(req, res, next) {
  const user = req.user;
  const ip = req.ip || req.connection.remoteAddress;
  
  // Nếu không có user hoặc không phải admin → bỏ qua
  if (!user || user.role !== 'admin') {
    return next();
  }
  
  // Danh sách hành vi nguy hiểm
  const dangerousActions = [
    'lock', 'unlock', 'export', 'delete', 
    'update', 'grant', 'revoke', 'config',
    'nâng cấp', 'xuất dữ liệu', 'thay đổi cấu hình'
  ];
  
  // Kiểm tra action từ URL hoặc body
  const url = req.url || '';
  const action = req.body.action || req.body.reason || '';
  const isDangerous = dangerousActions.some(d => 
    url.toLowerCase().includes(d) || 
    action.toLowerCase().includes(d) ||
    req.method === 'PUT' || req.method === 'DELETE'
  );
  
  if (isDangerous) {
    // Tạo approval token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 1800000; // 30 phút
    
    approvalTokens.set(token, {
      username: user.username,
      action: action || url,
      expiresAt: expiresAt,
      approved: false
    });
    
    // Ghi log
    await SecurityEvent.create({
      eventType: 'dangerous_action_attempt',
      severity: 'high',
      ip: ip,
      username: user.username,
      details: `Dangerous action attempted: ${action || url}`
    });
    
    // Yêu cầu approval
    return res.status(202).json({
      requireApproval: true,
      approvalToken: token,
      message: 'This action requires approval. Please check your email.',
      action: action || url
    });
  }
  
  next();
}

module.exports = {
  insiderGuardMiddleware,
  approvalTokens
};