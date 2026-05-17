require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const AutomationConfig = require('../models/AutomationConfig');

async function testRoute() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('Test user not found.');
      return;
    }

    console.log(`Checking config for user: ${user._id}`);
    const config = await AutomationConfig.findOne({ userId: user._id });
    console.log('Existing Config:', config);

    // Mock saving a config
    const mockData = {
      skills: ['React', 'Node.js'],
      location: 'Remote',
      maxJobsPerDay: 15,
      scheduledTime: '09:00',
      active: true
    };

    if (config) {
      config.skills = mockData.skills;
      config.location = mockData.location;
      config.maxJobsPerDay = mockData.maxJobsPerDay;
      config.scheduledTime = mockData.scheduledTime;
      config.active = mockData.active;
      await config.save();
      console.log('Config updated successfully:', config);
    } else {
      const newConfig = new AutomationConfig({
        userId: user._id,
        ...mockData
      });
      await newConfig.save();
      console.log('Config created successfully:', newConfig);
    }
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

testRoute();
