'use strict';

require('dotenv').config();

const { connectRabbitMQ } = require('./config/rabbitmq');
const { startConsumer } = require('./consumer');
const config = require('./config');

console.log('🚀 Starting Notification Service...');
console.log(`🌍 Environment: ${config.nodeEnv}`);
console.log(`🐇 RabbitMQ URL: ${config.rabbitmq.url}`);

// ─── Graceful Shutdown ────────────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Handle Unhandled Rejections ──────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

// ─── Start Service ────────────────────────────────────────
const start = async () => {
  // Connect to RabbitMQ
  await connectRabbitMQ();

  // Small delay to ensure channel is ready
  setTimeout(async () => {
    await startConsumer();
    console.log('✅ Notification Service ready');
  }, 1000);
};

start();
