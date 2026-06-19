const axios = require('axios');

async function runAttack() {
  console.log('🔴 Testing B8: Privilege Abuse Attack...');
  
  try {
    // Đăng ký admin trước nếu chưa có
    try {
      await axios.post('http://localhost:3000/api/register', {
        username: 'admin',
        password: 'admin123',
        email: 'admin@test.com',
        role: 'admin'
      });
      console.log('  ✅ Admin registered');
    } catch (e) {
      // Admin đã tồn tại
    }
    
    // Login với admin
    const loginResponse = await axios.post('http://localhost:3000/api/login', {
      username: 'admin',
      password: 'admin123'
    }, {
      validateStatus: () => true
    });
    
    // Nếu admin cần OTP, xử lý
    let token = null;
    if (loginResponse.status === 202 && loginResponse.data.requireOTP) {
      console.log('  OTP required for admin, trying to get from email...');
      
      // Lấy OTP từ email simulator
      const emailResponse = await axios.get('http://localhost:3002/api/email/inbox');
      const emails = emailResponse.data.inbox || [];
      const otpEmail = emails.find(e => e.username === 'admin' && e.otp);
      
      if (otpEmail && otpEmail.otp) {
        const verifyResponse = await axios.post('http://localhost:3000/api/verify-otp', {
          username: 'admin',
          otp: otpEmail.otp,
          fingerprint: loginResponse.data.fingerprint
        }, {
          validateStatus: () => true
        });
        
        if (verifyResponse.status === 200 && verifyResponse.data.token) {
          token = verifyResponse.data.token;
          console.log('  ✅ Admin OTP verified');
        }
      }
    } else if (loginResponse.status === 200 && loginResponse.data.token) {
      token = loginResponse.data.token;
      console.log('  ✅ Admin login successful');
    }
    
    if (!token) {
      console.log(`  Admin login failed: ${loginResponse.status}`);
      return {
        name: 'B8 - Privilege Abuse',
        passed: false,
        details: { error: 'Cannot login as admin' },
        message: '❌ Admin login failed'
      };
    }
    
    // Thực hiện hành vi nguy hiểm (lock user)
    const response = await axios.post('http://localhost:3000/api/admin/users/lock', {
      username: 'user2',
      reason: 'Test abuse'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      validateStatus: () => true
    });
    
    // Nếu status 202 là yêu cầu approval → PASS
    // Nếu status 403 là bị từ chối → PASS (vì đã được bảo vệ)
    const isProtected = response.status === 202 || response.status === 403 || response.status === 401;
    console.log(`  Dangerous action: ${response.status} - ${isProtected ? '✅ Protected' : '❌ Not protected'}`);
    
    return {
      name: 'B8 - Privilege Abuse',
      passed: isProtected,
      details: {
        status: response.status,
        protected: isProtected,
        data: response.data
      },
      message: isProtected ? '✅ Admin action protected' : '❌ Admin action not protected'
    };
    
  } catch (error) {
    console.log(`  Error: ${error.message}`);
    return {
      name: 'B8 - Privilege Abuse',
      passed: false,
      details: { error: error.message },
      message: '❌ Error testing privilege abuse'
    };
  }
}

module.exports = { runAttack };