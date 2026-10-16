const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn(`Auth failed (no token): ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ message: 'Access denied. No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // the user is identified from the token, never from client-supplied input
    const user = await User.findById(decoded.id);
    if (!user) {
      logger.warn(`Auth failed (user not found): ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logger.warn(`Auth failed (expired token): ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ message: 'Token expired' });
    }
    logger.warn(`Auth failed (invalid token): ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ message: 'Invalid token' });
  }
};