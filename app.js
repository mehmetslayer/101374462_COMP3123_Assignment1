const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');
const userRoutes = require('./src/routes/userRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes');
const { generalLimiter } = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// behind Vercel's proxy, trust it so rate limiting sees the real client IP
if (process.env.VERCEL) app.set('trust proxy', 1);

app.use(helmet()); // secure HTTP headers
app.use(express.json()); // parse json bodies into req.body

// request log: method, path, status, time (no headers or bodies, so no tokens/passwords)
app.use(morgan(':method :url :status :response-time ms', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// serverless: connect on the first request (a no-op locally, server.js connects first)
let dbReady;
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    dbReady = dbReady || connectDB().catch((err) => { dbReady = null; throw err; });
    await dbReady;
  }
  next();
});

// health check; confirms the server and DB are up
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api', generalLimiter);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/emp', employeeRoutes);

// unsupported routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;