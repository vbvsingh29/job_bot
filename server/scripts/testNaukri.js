require('dotenv').config();
const mongoose = require('mongoose');
const { runNaukriBot } = require('../bots/naukri');
const User = require('../models/User');

async function testNaukri() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    let user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    }

    console.log(`Running Naukri bot for user: ${user._id}`);
    
    const mockConfig = {
      skills: ['Software Engineer React'],
      location: 'Remote',
      maxJobs: 1, // Test only 1 job
      userId: user._id
    };

    console.log('Starting Naukri Bot...');
    const result = await runNaukriBot(mockConfig);
    
    console.log('Bot finished. Result:', result);
  } catch (err) {
    console.error('Test script failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

testNaukri();
