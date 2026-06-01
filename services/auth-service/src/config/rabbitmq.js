'use strict';

const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'marketplace_events';

let channel = null;

const connectPublisher = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

    console.log('✅ Auth Service: RabbitMQ publisher connected');

    connection.on('error', (error) => {
      console.error('❌ Auth Service RabbitMQ error:', error.message);
    });

    connection.on('close', () => {
      console.warn('⚠️  Auth Service RabbitMQ closed. Reconnecting in 5s...');
      setTimeout(connectPublisher, 5000);
    });

  } catch (error) {
    console.error('❌ Auth Service RabbitMQ connection failed:', error.message);
    setTimeout(connectPublisher, 5000);
  }
};

const publishEvent = (routingKey, data) => {
  try {
    if (!channel) {
      console.warn('⚠️  Cannot publish — RabbitMQ channel not ready');
      return false;
    }

    channel.publish(
      EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(data)),
      { persistent: true }
    );

    console.log(`📤 Published event [${routingKey}]`);
    return true;
  } catch (error) {
    console.error(`❌ Publish failed [${routingKey}]:`, error.message);
    return false;
  }
};

module.exports = { connectPublisher, publishEvent };
