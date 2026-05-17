const cron = require('node-cron');
const runner = require('./runner');
const emailService = require('./emailService');

function initScheduler() {
  console.log('Initializing node-cron scheduler...');

  // Job 1 — Daily bot runner at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    console.log(`[${new Date().toISOString()}] CRON: Triggering daily bot runner`);
    // Fire and forget
    runner.runForAllUsers().catch(err => {
      console.error('CRON: Error in runForAllUsers', err);
    });
  });

  // Job 2 — Daily email digest at 9:00 PM
  cron.schedule('0 21 * * *', () => {
    console.log(`[${new Date().toISOString()}] CRON: Triggering daily email digest`);
    // Fire and forget
    emailService.sendDailyReportsToAllUsers().catch(err => {
      console.error('CRON: Error in sendDailyReportsToAllUsers', err);
    });
  });
}

// Helper to calculate next run times for admin status
function getStatus() {
  // node-cron doesn't have an easy native way to get next date without parsing the cron string manually
  // This is a simple mock return for the admin route
  return {
    botRunner: {
      cron: '0 9 * * *',
      description: 'Daily bot runner at 9:00 AM'
    },
    emailDigest: {
      cron: '0 21 * * *',
      description: 'Daily email digest at 9:00 PM'
    }
  };
}

module.exports = {
  initScheduler,
  getStatus
};
