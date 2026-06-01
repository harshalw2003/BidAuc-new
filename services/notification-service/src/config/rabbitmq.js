'use strict';

const amqp = require('amqplib');
const config = require('./index');

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
  try {
    // Create connection
    connection = await amqp.connect(config.rabbitmq.url);
    console.log('✅ Notification Service: RabbitMQ connected');

    // Create channel
    channel = await connection.createChannel();

    // Declare exchange — topic type for pattern-based routing
    await channel.assertExchange(
      config.rabbitmq.exchange,
      'topic',
      { durable: true }  // survives RabbitMQ restart
    );

    // Declare queue
    await channel.assertQueue(
      config.rabbitmq.queue,
      { durable: true }  // survives RabbitMQ restart
    );

    // Bind queue to exchange for each routing key
    for (const routingKey of config.rabbitmq.routingKeys) {
      await channel.bindQueue(
        config.rabbitmq.queue,
        config.rabbitmq.exchange,
        routingKey
      );
      console.log(`✅ Bound queue to routing key: ${routingKey}`);
    }

    // Handle connection errors
    connection.on('error', (error) => {
      console.error('❌ RabbitMQ connection error:', error.message);
    });

    connection.on('close', () => {
      console.warn('⚠️  RabbitMQ connection closed. Reconnecting in 5s...');
      setTimeout(connectRabbitMQ, 5000);
    });

    return channel;
  } catch (error) {
    console.error('❌ RabbitMQ connection failed:', error.message);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectRabbitMQ, 5000);
  }
};

const getChannel = () => channel;

module.exports = { connectRabbitMQ, getChannel };
