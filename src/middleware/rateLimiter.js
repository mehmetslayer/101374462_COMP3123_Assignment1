const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const handler = (req, res) => {
  logger.warn(`Rate limit exceeded: ${req.method} ${req.originalUrl} from ${req.ip}`);
  res.status(429).json({ message: 'Too many requests, please try again later' });
};

// strict limit for signup/login (brute-force protection)
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// general limit for all /api traffic
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});