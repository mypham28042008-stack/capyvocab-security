const axios = require('axios');

async function runAttack() {
  console.log('🔴 Testing B7: App Modification Attack...');
  
  try {
    // Test 1: Checksum sai
    const response1 = await axios.post('http://localhost:3000/api/login', {
      username: 'user1',
      password: 'password123'
    }, {
      headers: {
        'X-App-Checksum': 'fake_checksum_12345',
        'X-App-Version': '1.0.0'
      },
      validateStatus: () => true
    });
    
    const blocked1 = response1.status === 403 || response1.status === 401 || response1.status === 400;
    console.log(`  Modified app (fake checksum): ${response1.status} - ${blocked1 ? '✅ Blocked' : '❌ Not blocked'}`);
    
    // Test 2: Login bình thường
    const response2 = await axios.post('http://localhost:3000/api/login', {
      username: 'user1',
      password: 'password123'
    }, {
      validateStatus: () => true
    });
    
    const success2 = response2.status === 200 || response2.status === 202;
    console.log(`  Normal login (no checksum): ${response2.status} - ${success2 ? '✅ Success' : '❌ Failed'}`);
    
    return {
      name: 'B7 - App Modification',
      passed: blocked1,
      details: {
        fakeChecksum: { status: response1.status, blocked: blocked1 },
        normalLogin: { status: response2.status, success: success2 }
      },
      message: blocked1 ? '✅ Modified app blocked' : '⚠️ App modification check issue'
    };
    
  } catch (error) {
    console.log(`  Error: ${error.message}`);
    return {
      name: 'B7 - App Modification',
      passed: false,
      details: { error: error.message },
      message: '❌ Error testing app modification'
    };
  }
}

module.exports = { runAttack };