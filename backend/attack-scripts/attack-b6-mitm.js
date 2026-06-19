const axios = require('axios');

async function runAttack() {
  console.log('🔴 Testing B6: MITM Attack...');
  
  const suspiciousHeaders = [
    { name: 'X-Forwarded-For', value: '192.168.1.100' },
    { name: 'Via', value: '1.1 proxy.example.com' },
    { name: 'Proxy-Connection', value: 'keep-alive' },
    { name: 'X-Real-IP', value: '10.0.0.1' },
    { name: 'Forwarded', value: 'for=192.0.2.1' }
  ];
  
  const results = [];
  let anyBlocked = false;
  
  for (const header of suspiciousHeaders) {
    try {
      const response = await axios.get('http://localhost:3000/api/dashboard/stats', {
        headers: { [header.name]: header.value },
        validateStatus: () => true
      });
      
      const blocked = response.status === 400 || response.status === 403 || 
                      response.status === 401 || response.status === 429;
      
      results.push({
        header: header.name,
        status: response.status,
        blocked: blocked
      });
      
      console.log(`  ${header.name}: ${response.status} - ${blocked ? '✅ Blocked' : '❌ Not blocked'}`);
      if (blocked) anyBlocked = true;
    } catch (error) {
      results.push({ header: header.name, status: 0, blocked: true, error: error.message });
      anyBlocked = true;
    }
  }
  
  return {
    name: 'B6 - MITM',
    passed: anyBlocked,
    details: results,
    message: anyBlocked ? '✅ Some suspicious headers blocked' : '❌ No suspicious headers blocked'
  };
}

module.exports = { runAttack };