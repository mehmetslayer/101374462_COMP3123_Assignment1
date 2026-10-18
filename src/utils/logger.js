const fs = require('fs');
const path = require('path');
const winston = require('winston');

const transports = [new winston.transports.Console()];

// Vercel's filesystem is read-only, so file logging only runs locally
if (!process.env.VERCEL) {
  const logDir = path.join(__dirname, '..', '..', 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  transports.push(new winston.transports.File({ filename: path.join(logDir, 'app.log') }));
}

const logger = winston.createLogger({
  level: 'http',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`)
  ),
  transports,
});

module.exports = logger;