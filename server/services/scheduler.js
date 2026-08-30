const cron = require('node-cron');
const runner = require('./runner');
const emailService = require('./emailService');
const AutomationConfig = require('../models/AutomationConfig');

function initScheduler() {
  console.log('Initializing node-cron scheduler (1-minute polling interval)...');

  // Poll every minute to find matching user schedules
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    // Get hours and minutes in HH:MM format (local time)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    try {
      // 1. Check for users scheduled to run the bot at this exact minute
      const configsToRun = await AutomationConfig.find({ active: true, scheduledTime: timeStr });
      if (configsToRun.length > 0) {
        console.log(`[${now.toISOString()}] Scheduler: Found ${configsToRun.length} users scheduled to run bot at ${timeStr}`);
        for (const config of configsToRun) {
          console.log(`Scheduler: Triggering bot for user ${config.userId}`);
          runner.runForUser(config.userId).catch(err => {
            console.error(`Scheduler error running bot for user ${config.userId}:`, err);
          });
        }
      }

      // 2. Check for users scheduled to receive their email report at this exact minute
      const configsToReport = await AutomationConfig.find({ active: true, scheduledReportTime: timeStr });
      if (configsToReport.length > 0) {
        console.log(`[${now.toISOString()}] Scheduler: Found ${configsToReport.length} users scheduled for email digests at ${timeStr}`);
        for (const config of configsToReport) {
          console.log(`Scheduler: Sending email report to user ${config.userId}`);
          emailService.sendDailyReportToUser(config.userId).catch(err => {
            console.error(`Scheduler error sending email to user ${config.userId}:`, err);
          });
        }
      }
    } catch (err) {
      console.error('Scheduler polling error:', err);
    }
  });
}

// Helper to calculate next run times for admin status
function getStatus() {
  return {
    botRunner: {
      cron: '* * * * *',
      description: 'Dynamic user-specific schedules polled every minute'
    },
    emailDigest: {
      cron: '* * * * *',
      description: 'Dynamic user-specific email report schedules polled every minute'
    }
  };
}

module.exports = {
  initScheduler,
  getStatus
};
