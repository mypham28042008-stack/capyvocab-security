const express = require('express');
const router = express.Router();

// ===== MOCK DATA =====
const mockResults = [
  { name: 'B1 - Credential Stuffing', passed: true, message: '✅ Rate limit blocked IP after 5 failed attempts' },
  { name: 'B2 - Session Hijacking', passed: true, message: '✅ Session binding detected fingerprint mismatch' },
  { name: 'B3 - Auth Bypass', passed: true, message: '✅ Detected suspicious headers/params' },
  { name: 'B4 - WebShell', passed: true, message: '✅ Blocked all webshell patterns' },
  { name: 'B5 - SIM Swap', passed: true, message: '✅ OTP required and blocked after 3 failures' },
  { name: 'B6 - MITM', passed: true, message: '✅ Blocked suspicious proxy headers' },
  { name: 'B7 - App Modification', passed: true, message: '✅ Checksum mismatch detected' },
  { name: 'B8 - Privilege Abuse', passed: true, message: '✅ Admin action requires approval token' }
];

router.post('/api/test/attack-all', async (req, res) => {
  // KIỂM TRA BIẾN MÔI TRƯỜNG
  const useMock = process.env.USE_MOCK === 'true';
  
  if (useMock) {
    // CHẾ ĐỘ MOCK - Luôn trả về 8/8 PASS
    console.log('🧪 Running in MOCK mode - 8/8 PASS');
    return res.json({
      success: true,
      message: 'All attack tests completed (MOCK MODE)',
      results: mockResults
    });
  }
  
  // CHẾ ĐỘ THỰC - Gọi attack scripts thật
  try {
    console.log('🔴 Running in REAL mode - Executing actual attacks');
    const { runAllAttacks } = require('../attack-scripts/attack-runner');
    const results = await runAllAttacks();
    res.json({
      success: true,
      message: 'All attack tests completed (REAL MODE)',
      results: results
    });
  } catch (error) {
    console.error('Error running attacks:', error);
    res.status(500).json({
      success: false,
      error: 'Attack test failed',
      message: error.message
    });
  }
});

module.exports = router;