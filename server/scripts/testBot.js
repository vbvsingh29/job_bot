require('dotenv').config();
const mongoose = require('mongoose');
const { runLinkedInBot } = require('../bots/linkedin');
const User = require('../models/User');

async function testBot() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // 1. Get or create a mock user
    let user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    }

    console.log(`Running bot for user: ${user._id}`);
    
    // 2. Mock Config (only 1 job to test)
    const mockConfig = {
      accessToken: null,
      skills: ['Software Engineer React'],
      location: 'Remote',
      maxJobs: 1, // Test only 1 job
      userId: user._id
    };

    console.log('Starting LinkedIn Bot...');
    const result = await runLinkedInBot(mockConfig);
    
    console.log('Bot finished. Result:', result);
  } catch (err) {
    console.error('Test script failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

testBot();
