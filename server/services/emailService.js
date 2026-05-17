const nodemailer = require('nodemailer');
const AutomationConfig = require('../models/AutomationConfig');
const Application = require('../models/Application');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS
  }
});

async function sendDailyReport(user, results) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
    console.warn('Email credentials not set. Skipping email send for user', user.email);
    return;
  }

  const { total, success, failed, skipped, successApps, failedApps } = results;
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const subject = `LaunchPad — ${total} jobs applied today · ${dateStr}`;

  let successRows = successApps.map(app => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; color: #111827; font-weight: 500;">${app.jobTitle}</td>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">${app.company}</td>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; background-color: #E6F1FB; color: #185FA5;">
          ${app.platform}
        </span>
      </td>
    </tr>
  `).join('');

  if (successApps.length === 0) {
    successRows = `<tr><td colspan="3" style="padding: 10px; color: #6B7280; text-align: center;">No successful applications today.</td></tr>`;
  }

  let failedRows = failedApps.map(app => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; color: #111827; font-weight: 500;">${app.jobTitle}</td>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">${app.company}</td>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; color: #A32D2D; font-size: 12px;">${app.notes || 'Unknown error'}</td>
    </tr>
  `).join('');

  if (failedApps.length === 0) {
    failedRows = `<tr><td colspan="3" style="padding: 10px; color: #6B7280; text-align: center;">No failed applications!</td></tr>`;
  }

  const html = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
      
      <!-- Header -->
      <div style="background-color: #185FA5; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700;">LaunchPad</h1>
        <p style="margin: 4px 0 0 0; color: #E6F1FB; font-size: 14px;">Daily Automation Report · ${dateStr}</p>
      </div>

      <!-- Summary -->
      <div style="padding: 24px; background-color: #F8F9FA; border-bottom: 1px solid #E5E7EB;">
        <table style="width: 100%; text-align: center; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px;">
              <div style="font-size: 24px; font-weight: 700; color: #111827;">${total}</div>
              <div style="font-size: 12px; color: #4B5563; text-transform: uppercase;">Total Applied</div>
            </td>
            <td style="padding: 10px;">
              <div style="font-size: 24px; font-weight: 700; color: #0F6E56;">${success}</div>
              <div style="font-size: 12px; color: #4B5563; text-transform: uppercase;">Success</div>
            </td>
            <td style="padding: 10px;">
              <div style="font-size: 24px; font-weight: 700; color: #A32D2D;">${failed}</div>
              <div style="font-size: 12px; color: #4B5563; text-transform: uppercase;">Failed</div>
            </td>
            <td style="padding: 10px;">
              <div style="font-size: 24px; font-weight: 700; color: #6B7280;">${skipped}</div>
              <div style="font-size: 12px; color: #4B5563; text-transform: uppercase;">Skipped</div>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding: 24px;">
        <!-- Success Section -->
        <h2 style="font-size: 18px; color: #111827; margin: 0 0 16px 0;">✅ Successfully Applied</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 14px; text-align: left;">
          <thead>
            <tr>
              <th style="padding: 10px; border-bottom: 2px solid #E5E7EB; color: #4B5563; font-weight: 600;">Job Title</th>
              <th style="padding: 10px; border-bottom: 2px solid #E5E7EB; color: #4B5563; font-weight: 600;">Company</th>
              <th style="padding: 10px; border-bottom: 2px solid #E5E7EB; color: #4B5563; font-weight: 600;">Platform</th>
            </tr>
          </thead>
          <tbody>
            ${successRows}
          </tbody>
        </table>

        <!-- Failed Section -->
        <h2 style="font-size: 18px; color: #111827; margin: 0 0 16px 0;">❌ Failed</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
          <thead>
            <tr>
              <th style="padding: 10px; border-bottom: 2px solid #E5E7EB; color: #4B5563; font-weight: 600;">Job Title</th>
              <th style="padding: 10px; border-bottom: 2px solid #E5E7EB; color: #4B5563; font-weight: 600;">Company</th>
              <th style="padding: 10px; border-bottom: 2px solid #E5E7EB; color: #4B5563; font-weight: 600;">Error message</th>
            </tr>
          </thead>
          <tbody>
            ${failedRows}
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div style="background-color: #F8F9FA; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="margin: 0; color: #4B5563; font-size: 14px;">Manage your automation at <a href="https://launchpad.app" style="color: #185FA5; text-decoration: none;">launchpad.app</a></p>
      </div>

    </div>
  `;

  await transporter.sendMail({
    from: `"LaunchPad" <${process.env.GMAIL_USER}>`,
    to: process.env.REPORT_EMAIL || user.email,
    subject,
    html
  });
}

async function sendDailyReportsToAllUsers() {
  console.log('Starting daily email digests...');
  const activeConfigs = await AutomationConfig.find({ active: true });
  
  // Get start of today
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  let emailsSent = 0;

  for (const config of activeConfigs) {
    const user = await User.findById(config.userId);
    if (!user) continue;

    // Get today's applications for this user
    const apps = await Application.find({
      userId: user._id,
      appliedAt: { $gte: startOfToday }
    }).sort({ appliedAt: -1 });

    // We still send report even if 0 apps, just to confirm it ran.
    const successApps = apps.filter(a => a.status === 'success');
    const failedApps = apps.filter(a => a.status === 'failed');
    const skipped = apps.filter(a => a.status === 'skipped').length;
    
    const results = {
      total: apps.length,
      success: successApps.length,
      failed: failedApps.length,
      skipped,
      successApps,
      failedApps
    };

    try {
      await sendDailyReport(user, results);
      emailsSent++;
      console.log(`Sent report to ${user.email}`);
    } catch (err) {
      console.error(`Failed to send report to ${user.email}:`, err);
    }

    // Delay to avoid Gmail rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`Daily digests completed. Sent ${emailsSent} emails.`);
}

module.exports = {
  sendDailyReport,
  sendDailyReportsToAllUsers
};
