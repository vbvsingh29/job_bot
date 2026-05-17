require('dotenv').config();
const { sendDailyReport } = require('../services/emailService');

async function testEmail() {
  try {
    const mockUser = {
      email: process.env.REPORT_EMAIL || 'test@example.com',
      name: 'Test User'
    };

    const mockResults = {
      total: 3,
      success: 2,
      failed: 1,
      skipped: 0,
      successApps: [
        { jobTitle: 'Frontend Developer', company: 'TechCorp', platform: 'linkedin' },
        { jobTitle: 'React Engineer', company: 'StartUp Inc', platform: 'naukri' }
      ],
      failedApps: [
        { jobTitle: 'Senior Software Engineer', company: 'BigTech', notes: 'Timeout waiting for selector' }
      ]
    };

    console.log(`Sending test email to ${mockUser.email}...`);
    await sendDailyReport(mockUser, mockResults);
    console.log('Email sent successfully!');
  } catch (err) {
    console.error('Test script failed:', err);
  }
}

testEmail();
