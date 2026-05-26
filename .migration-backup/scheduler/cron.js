const scheduler = require('../backend/services/scheduler.js');

// Optional: Start scheduler with default frequency on boot
// Uncomment to auto-start:
// scheduler.startScheduler('hourly');

console.log('🚀 QA360 Scheduler ready. Use UI to control (start/stop/set frequency)');
console.log('Available frequencies: 5min, 15min, hourly, daily');
console.log('Sites loaded from config/sites.json');
