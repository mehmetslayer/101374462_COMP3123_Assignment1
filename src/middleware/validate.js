const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  logger.warn(`Validation failed: ${req.method} ${req.originalUrl} (${errors.map((e) => e.field).join(', ')})`);
  res.status(400).json({ message: 'Validation failed', errors });
};