require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');

const seedApplications = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding');

    const email = process.argv[2];
    if (!email) {
      console.error('Please provide a user email. Usage: node seedApplications.js <email>');
      process.exit(1);
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    const dummyApps = [
      { jobTitle: 'Frontend Developer', company: 'Google', platform: 'linkedin', status: 'success', appliedAt: new Date() },
      { jobTitle: 'React Engineer', company: 'Meta', platform: 'linkedin', status: 'success', appliedAt: new Date(Date.now() - 86400000) }, // 1 day ago
      { jobTitle: 'Fullstack Dev', company: 'Amazon', platform: 'naukri', status: 'failed', errorMsg: 'Failed to find apply button', appliedAt: new Date(Date.now() - 172800000) }, // 2 days ago
      { jobTitle: 'Software Engineer', company: 'Netflix', platform: 'linkedin', status: 'skipped', errorMsg: 'Already applied', appliedAt: new Date() },
      { jobTitle: 'SDE II', company: 'Microsoft', platform: 'naukri', status: 'success', appliedAt: new Date(Date.now() - 604800000) }, // 7 days ago
      { jobTitle: 'Web Developer', company: 'Apple', platform: 'linkedin', status: 'success', appliedAt: new Date(Date.now() - 259200000) }, // 3 days ago
      { jobTitle: 'MERN Stack Developer', company: 'Startup Inc', platform: 'naukri', status: 'success', appliedAt: new Date() },
      { jobTitle: 'UI Engineer', company: 'Tesla', platform: 'linkedin', status: 'failed', errorMsg: 'Captcha block', appliedAt: new Date(Date.now() - 432000000) }, // 5 days ago
    ];

    const appsToInsert = dummyApps.map(app => ({
      ...app,
      userId: user._id
    }));

    await Application.insertMany(appsToInsert);
    console.log(`Successfully seeded ${appsToInsert.length} applications for user ${email}`);

  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedApplications();
