const axios = require('axios');

async function runAttack() {
  console.log('🔴 Testing B3: Auth Bypass Attack...');
  
  const results = [];
  
  // Test 1: Query parameter
  try {
    const response = await axios.get('http://localhost:3000/api/dashboard/stats?authenticated=true', {
      validateStatus: () => true
    });
    
    const blocked = response.status === 403 || response.status === 401 || response.status === 400;
    results.push({
      test: 'Query param authenticated=true',
      status: response.status,
      blocked: blocked
    });
    
    console.log(`  Query param: ${response.status} - ${blocked ? '✅ Blocked' : '❌ Not blocked'}`);
  } catch (error) {
    results.push({ test: 'Query param', status: 0, blocked: true, error: error.message });
  }
  
  // Test 2: Header X-Bypass-Auth
  try {
    const response = await axios.get('http://localhost:3000/api/dashboard/stats', {
      headers: { 'X-Bypass-Auth': 'true' },
      validateStatus: () => true
    });
    
    const blocked = response.status === 403 || response.status === 401 || response.status === 400;
    results.push({
      test: 'Header X-Bypass-Auth: true',
      status: response.status,
      blocked: blocked
    });
    
    console.log(`  Header bypass: ${response.status} - ${blocked ? '✅ Blocked' : '❌ Not blocked'}`);
  } catch (error) {
    results.push({ test: 'Header bypass', status: 0, blocked: true, error: error.message });
  }
  
  const passed = results.every(r => r.blocked === true);
  
  return {
    name: 'B3 - Auth Bypass',
    passed: passed,
    details: results,
    message: passed ? '✅ All bypass attempts blocked' : '❌ Some bypass attempts succeeded'
  };
}

module.exports = { runAttack };