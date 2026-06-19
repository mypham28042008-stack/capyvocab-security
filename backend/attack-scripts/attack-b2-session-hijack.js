const axios = require('axios');

async function runAttack() {
  console.log('🔴 Testing B2: Session Hijacking Attack...');
  
  try {
    // Đăng nhập với user1 (có thể cần OTP)
    const loginResponse = await axios.post('http://localhost:3000/api/login', {
      username: 'user1',
      password: 'password123'
    }, {
      validateStatus: () => true
    });
    
    // Nếu yêu cầu OTP, thử xác thực OTP
    let token = null;
    if (loginResponse.status === 202 && loginResponse.data.requireOTP) {
      console.log('  OTP required, trying to bypass for test...');
      
      // Lấy OTP từ email simulator
      const emailResponse = await axios.get('http://localhost:3002/api/email/inbox');
      const emails = emailResponse.data.inbox || [];
      const otpEmail = emails.find(e => e.username === 'user1' && e.otp);
      
      if (otpEmail && otpEmail.otp) {
        console.log(`  Found OTP: ${otpEmail.otp}`);
        
        const verifyResponse = await axios.post('http://localhost:3000/api/verify-otp', {
          username: 'user1',
          otp: otpEmail.otp,
          fingerprint: loginResponse.data.fingerprint
        }, {
          validateStatus: () => true
        });
        
        if (verifyResponse.status === 200 && verifyResponse.data.token) {
          token = verifyResponse.data.token;
          console.log('  ✅ OTP verified successfully');
        }
      }
    } else if (loginResponse.status === 200 && loginResponse.data.token) {
      token = loginResponse.data.token;
      console.log('  ✅ Login successful (trusted device)');
    }
    
    if (!token) {
      console.log(`  Login failed: ${loginResponse.status}`);
      return {
        name: 'B2 - Session Hijacking',
        passed: false,
        details: { error: 'Login failed - cannot get token' },
        message: '❌ Cannot login to test session hijack'
      };
    }
    
    // Giả mạo request từ thiết bị khác
    const hijackResponse = await axios.get('http://localhost:3000/api/session', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'HackerAgent/1.0',
        'Accept-Language': 'en-US'
      },
      validateStatus: () => true
    });
    
    const passed = hijackResponse.status === 401 || hijackResponse.status === 403;
    console.log(`  Hijack attempt: ${hijackResponse.status} - ${passed ? '✅ Blocked' : '❌ Not blocked'}`);
    
    return {
      name: 'B2 - Session Hijacking',
      passed: passed,
      details: {
        status: hijackResponse.status,
        message: hijackResponse.data?.message || ''
      },
      message: passed ? '✅ Session hijack detected and blocked' : '❌ Session hijack not detected'
    };
    
  } catch (error) {
    console.log(`  Error: ${error.message}`);
    return {
      name: 'B2 - Session Hijacking',
      passed: false,
      details: { error: error.message },
      message: '❌ Error testing session hijack'
    };
  }
}

module.exports = { runAttack };