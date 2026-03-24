const runTests = require('../server/runTest');

setInterval(() => {
  console.log('⏱️ Running scheduled tests...');
  runTests();
}, 10000); // every 10 seconds