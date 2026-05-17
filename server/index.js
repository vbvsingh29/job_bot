require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');

// Import services to start scheduler
const { initScheduler } = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Session is required for Passport OAuth strategies (like Google)
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback_session_secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/auth', require('./routes/auth')); // For /auth/google
app.use('/api/auth', require('./routes/auth')); // For /api/auth/*
app.use('/api/profile', require('./routes/profile'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/automations', require('./routes/automations'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/blog', require('./routes/blog'));

// Initialize Scheduler
initScheduler();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});
