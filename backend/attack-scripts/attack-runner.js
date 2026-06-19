const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Hàm tạo dữ liệu mẫu
async function setupTestData() {
  console.log('🔧 Setting up test data...');
  try {
    // Tạo user1
    await axios.post('http://localhost:3000/api/register', {
      username: 'user1',
      password: 'password123',
      email: 'user1@test.com'
    }).catch(() => {});
    
    // Tạo user2
    await axios.post('http://localhost:3000/api/register', {
      username: 'user2',
      password: 'password123',
      email: 'user2@test.com'
    }).catch(() => {});
    
    // Tạo admin
    await axios.post('http://localhost:3000/api/register', {
      username: 'admin',
      password: 'admin123',
      email: 'admin@test.com',
      role: 'admin'
    }).catch(() => {});
    
    console.log('✅ Test data ready.');
  } catch (e) {
    console.log('⚠️ Could not setup data:', e.message);
  }
}

async function runAllAttacks() {
  console.log('\n🧪 ========================================');
  console.log('🧪 STARTING ALL ATTACK TESTS...');
  console.log('🧪 ========================================\n');

  await setupTestData();

  const testCases = [
    {
      name: 'B1 - Credential Stuffing',
      run: async () => {
        const { runAttack } = require('./attack-b1-credential-stuffing');
        return await runAttack();
      }
    },
    {
      name: 'B2 - Session Hijacking',
      run: async () => {
        const { runAttack } = require('./attack-b2-session-hijack');
        return await runAttack();
      }
    },
    {
      name: 'B3 - Auth Bypass',
      run: async () => {
        const { runAttack } = require('./attack-b3-auth-bypass');
        return await runAttack();
      }
    },
    {
      name: 'B4 - WebShell',
      run: async () => {
        const { runAttack } = require('./attack-b4-webshell');
        return await runAttack();
      }
    },
    {
      name: 'B5 - SIM Swap',
      run: async () => {
        const { runAttack } = require('./attack-b5-sim-swap');
        return await runAttack();
      }
    },
    {
      name: 'B6 - MITM',
      run: async () => {
        const { runAttack } = require('./attack-b6-mitm');
        return await runAttack();
      }
    },
    {
      name: 'B7 - App Modification',
      run: async () => {
        const { runAttack } = require('./attack-b7-app-mod');
        return await runAttack();
      }
    },
    {
      name: 'B8 - Privilege Abuse',
      run: async () => {
        const { runAttack } = require('./attack-b8-privilege-abuse');
        return await runAttack();
      }
    }
  ];

  const results = [];
  for (const test of testCases) {
    try {
      const result = await test.run();
      results.push({ name: test.name, ...result });
      console.log(`\n${result.passed ? '✅' : '❌'} ${test.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
      if (result.details) {
        console.log(`   ${JSON.stringify(result.details, null, 2)}`);
      }
    } catch (error) {
      console.error(`❌ Error in ${test.name}:`, error.message);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  console.log('\n📊 ========================================');
  console.log(`📊 SUMMARY: ${passed}/${total} tests passed`);
  console.log('📊 ========================================\n');
  return results;
}

module.exports = { runAllAttacks };

if (require.main === module) {
  runAllAttacks();
}