'use strict';

const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'marketplace_events';
const QUEUE = 'user_service_queue';
const ROUTING_KEYS = ['user.registered'];

let channel = null;

const connectConsumer = async (onMessage) => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Declare exchange
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

    // Declare queue
    await channel.assertQueue(QUEUE, { durable: true });

    // Bind routing keys
    for (const key of ROUTING_KEYS) {
      await channel.bindQueue(QUEUE, EXCHANGE, key);
      console.log(`✅ User Service: Bound to routing key: ${key}`);
    }

    // Process one message at a time
    channel.prefetch(1);

    console.log(`👂 User Service: Listening on queue: ${QUEUE}`);

    // Start consuming
    channel.consume(QUEUE, async (message) => {
      if (!message) return;

      try {
        const routingKey = message.fields.routingKey;
        const data = JSON.parse(message.content.toString());

        console.log(`📩 User Service received [${routingKey}]`);

        await onMessage(routingKey, data);

        channel.ack(message);
        console.log(`✅ User Service: Message acknowledged`);
      } catch (error) {
        console.error('❌ User Service: Message processing failed:', error.message);
        channel.nack(message, false, false);
      }
    }, { noAck: false });

    connection.on('error', (error) => {
      console.error('❌ User Service RabbitMQ error:', error.message);
    });

    connection.on('close', () => {
      console.warn('⚠️  User Service RabbitMQ closed. Reconnecting in 5s...');
      setTimeout(() => connectConsumer(onMessage), 5000);
    });

    console.log('✅ User Service: RabbitMQ consumer connected');

  } catch (error) {
    console.error('❌ User Service RabbitMQ connection failed:', error.message);
    setTimeout(() => connectConsumer(onMessage), 5000);
  }
};

module.exports = { connectConsumer };
