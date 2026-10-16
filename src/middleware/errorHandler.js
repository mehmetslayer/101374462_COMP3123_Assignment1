const logger = require('../utils/logger');

// Express identifies error handlers by the 4 arguments
module.exports = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    logger.warn(`Malformed JSON: ${req.method} ${req.originalUrl}`);
    return res.status(400).json({ message: 'Malformed JSON in request body' });
  }

  logger.error(`${req.method} ${req.originalUrl}: ${err.message}`);
  // never leak the stack trace or internals to the client
  res.status(err.status || 500).json({ message: 'Server error' });
};