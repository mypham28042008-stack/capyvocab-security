const { runAllAttacks } = require('../backend/attack-scripts/attack-runner');

console.log('🧪 Running all attack tests...\n');

runAllAttacks()
  .then(results => {
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    console.log(`\n📊 Final: ${passed}/${total} tests passed`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });