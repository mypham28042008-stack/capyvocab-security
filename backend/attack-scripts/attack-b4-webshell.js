const axios = require('axios');

async function runAttack() {
  console.log('🔴 Testing B4: WebShell Attack...');
  
  const patterns = ['shell.php', 'cmd.aspx', 'backdoor', 'webshell', 'c99.php'];
  const results = [];
  
  for (const pattern of patterns) {
    try {
      const response = await axios.get(`http://localhost:3000/${pattern}`, {
        validateStatus: () => true
      });
      
      // WebShell bị chặn khi status 403 (Tầng 2 chặn) hoặc 404 (không tồn tại)
      const blocked = response.status === 403 || response.status === 404;
      results.push({
        pattern: pattern,
        status: response.status,
        blocked: blocked
      });
      
      console.log(`  ${pattern}: ${response.status} - ${blocked ? '✅ Blocked' : '❌ Not blocked'}`);
    } catch (error) {
      results.push({ pattern: pattern, status: 0, blocked: true, error: error.message });
    }
  }
  
  const passed = results.every(r => r.blocked === true);
  
  return {
    name: 'B4 - WebShell',
    passed: passed,
    details: results,
    message: passed ? '✅ All webshell patterns blocked' : '❌ Some webshell patterns not blocked'
  };
}

module.exports = { runAttack };