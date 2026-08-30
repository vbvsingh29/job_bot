const AutomationConfig = require('../models/AutomationConfig');
const User = require('../models/User');
const { runLinkedInBot } = require('../bots/linkedin');
const { runNaukriBot } = require('../bots/naukri');

async function runForUser(userId) {
  try {
    const config = await AutomationConfig.findOne({ userId });
    const user = await User.findById(userId);

    if (!config || !user) {
      console.log(`Run aborted for user ${userId}: Config or User not found.`);
      return null;
    }

    if (!config.active) {
      console.log(`Run aborted for user ${userId}: Automation is inactive.`);
      return null;
    }

    let totalResults = { success: 0, failed: 0, skipped: 0 };
    let linkedinResults = null;
    let naukriResults = null;

    // 1. LinkedIn Bot
    if (user.linkedinConnected || (process.env.LINKEDIN_EMAIL && process.env.LINKEDIN_PASS)) {
      console.log(`Starting LinkedIn bot for user ${userId}...`);
      
      let email = process.env.LINKEDIN_EMAIL;
      let password = process.env.LINKEDIN_PASS;
      
      if (user.linkedinConnected && user.linkedinEmail && user.linkedinPassword) {
        const cryptoUtils = require('../utils/crypto');
        const decryptedEmail = user.linkedinEmail;
        const decryptedPassword = cryptoUtils.decrypt(user.linkedinPassword);
        if (decryptedEmail && decryptedPassword) {
          email = decryptedEmail;
          password = decryptedPassword;
        }
      }
      
      try {
        linkedinResults = await runLinkedInBot({
          email: email,
          password: password,
          skills: config.skills,
          location: config.location,
          maxJobs: config.maxJobsPerDay,
          userId: userId
        });
        
        totalResults.success += linkedinResults.success;
        totalResults.failed += linkedinResults.failed;
        totalResults.skipped += linkedinResults.skipped;
      } catch (err) {
        if (err.message === 'captcha_detected') {
          console.error(`CAPTCHA detected for user ${userId}. Aborting LinkedIn run.`);
        } else {
          console.error(`LinkedIn bot failed for user ${userId}:`, err);
        }
      }
    }

    // 2. Naukri Bot
    if (user.naukriConnected || (process.env.NAUKRI_TEST_EMAIL && process.env.NAUKRI_TEST_PASS)) {
      console.log(`Starting Naukri bot for user ${userId}...`);
      
      let email = process.env.NAUKRI_TEST_EMAIL;
      let password = process.env.NAUKRI_TEST_PASS;
      
      if (user.naukriConnected && user.naukriEmail && user.naukriPassword) {
        const cryptoUtils = require('../utils/crypto');
        const decryptedEmail = user.naukriEmail;
        const decryptedPassword = cryptoUtils.decrypt(user.naukriPassword);
        if (decryptedEmail && decryptedPassword) {
          email = decryptedEmail;
          password = decryptedPassword;
        }
      }
      
      try {
        naukriResults = await runNaukriBot({
          email: email,
          password: password,
          skills: config.skills,
          location: config.location,
          maxJobs: config.maxJobsPerDay,
          userId: userId
        });
        
        totalResults.success += naukriResults.success;
        totalResults.failed += naukriResults.failed;
        totalResults.skipped += naukriResults.skipped;
      } catch (err) {
        if (err.message === 'captcha_detected') {
          console.error(`CAPTCHA detected for user ${userId}. Aborting Naukri run.`);
        } else {
          console.error(`Naukri bot failed for user ${userId}:`, err);
        }
      }
    }

    // Update config with results
    config.lastRunAt = new Date();
    config.lastRunResult = totalResults;
    await config.save();

    console.log(`Completed run for user ${userId}. Result:`, totalResults);
    return {
      linkedin: linkedinResults,
      naukri: naukriResults,
      total: totalResults
    };

  } catch (error) {
    console.error(`Runner failed for user ${userId}:`, error);
    throw error;
  }
}

async function runForAllUsers() {
  const configs = await AutomationConfig.find({ active: true });
  for (const config of configs) {
    await runForUser(config.userId);
    // 5 second delay between users to avoid IP blocks
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

module.exports = {
  runForUser,
  runForAllUsers
};
