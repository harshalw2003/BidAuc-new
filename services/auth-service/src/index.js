'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config');
const connectDatabase = require('./config/database');
const { connectPublisher, publishEvent } = require('./config/rabbitmq');
const authRoutes = require('./routes/auth');
const User = require('./models/User');

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
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);

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

// ─── Publish All Existing Users on Startup ────────────────
// This ensures user-service DB is always in sync
// even after restarts or new deployments
const publishExistingUsers = async () => {
  try {
    // Wait for RabbitMQ channel to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));

    const users = await User.find({}).select('-password');
    console.log(`📤 Publishing ${users.length} existing users to user-service...`);

    for (const user of users) {
      publishEvent('user.registered', {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        profilePhoto: user.profilePhoto || '',
        address: user.address || '',
        bio: user.bio || '',
        skills: user.skills || [],
        createdAt: user.createdAt
      });

      // Small delay between publishes
      // Prevents overwhelming RabbitMQ
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Published ${users.length} users successfully`);
  } catch (error) {
    console.error('❌ Failed to publish existing users:', error.message);
  }
};

// ─── Start Server ─────────────────────────────────────────
const startServer = async () => {
  await connectDatabase();
  await connectPublisher();

  // Publish existing users after RabbitMQ is connected
  publishExistingUsers();

  app.listen(config.port, () => {
    console.log(`✅ Auth Service running on port ${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
  });
};

startServer();