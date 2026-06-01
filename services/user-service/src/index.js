'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config');
const connectDatabase = require('./config/database');
const { connectConsumer } = require('./config/rabbitmq');
const { handleUserRegistered } = require('./handlers/userHandler');
const userRoutes = require('./routes/users');

const app = express();

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

// ─── Routes ───────────────────────────────────────────────
app.use('/api/users', userRoutes);

// ─── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

// ─── Graceful Shutdown ────────────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Message Router ───────────────────────────────────────
const handleMessage = async (routingKey, data) => {
  switch (routingKey) {
    case 'user.registered':
      await handleUserRegistered(data);
      break;
    default:
      console.warn(`⚠️  Unknown routing key: ${routingKey}`);
  }
};

// ─── Start Server ─────────────────────────────────────────
const startServer = async () => {
  await connectDatabase();
  await connectConsumer(handleMessage);

  app.listen(config.port, () => {
    console.log(`✅ User Service running on port ${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
  });
};

startServer();