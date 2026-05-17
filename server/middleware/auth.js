const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // Check suspended status — lightweight select of only what we need
    const user = await User.findById(decoded.id).select('suspended role').lean();
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (user.suspended) {
      return res.status(403).json({ message: 'Account suspended. Contact support.' });
    }

    req.user = { ...decoded, role: user.role }; // Ensure role is always fresh from DB
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = auth;
