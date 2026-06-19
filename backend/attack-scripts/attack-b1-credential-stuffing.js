const axios = require('axios');

async function runAttack() {
  console.log('🔴 Testing B1: Credential Stuffing Attack...');
  
  const target = 'http://localhost:3000/api/login';
  const results = [];
  let rateLimited = false;
  
  // Đảm bảo IP không bị chặn trước
  // Gửi 6 lần login sai (đủ để trigger rate limit)
  for (let i = 1; i <= 6; i++) {
    try {
      const response = await axios.post(target, {
        username: `fake_user_${i}`,
        password: 'wrong_password'
      }, {
        validateStatus: () => true
      });
      
      if (response.status === 429) {
        rateLimited = true;
        console.log(`  ✅ Rate limit triggered at attempt ${i}!`);
      }
      
      results.push({
        attempt: i,
        status: response.status,
        blocked: response.status === 429,
        message: response.data?.error || response.data?.message || ''
      });
      
      console.log(`  Attempt ${i}: ${response.status}`);
    } catch (error) {
      results.push({ attempt: i, status: 0, blocked: false, error: error.message });
    }
  }
  
  // PASS nếu có bất kỳ request nào bị chặn (status 429)
  const passed = results.some(r => r.status === 429);
  
  return {
    name: 'B1 - Credential Stuffing',
    passed: passed,
    details: results,
    message: passed ? '✅ Rate limit triggered successfully' : '❌ Rate limit not triggered'
  };
}

module.exports = { runAttack };