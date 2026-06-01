'use strict';

const { getChannel } = require('./config/rabbitmq');
const config = require('./config');
const {
  handleBidAccepted,
  handlePaymentCompleted
} = require('./handlers/smsHandler');

// ─── Route Event to Correct Handler ──────────────────────
const processMessage = async (routingKey, data) => {
  console.log(`📨 Processing event: ${routingKey}`);

  switch (routingKey) {
    case 'bid.accepted':
      await handleBidAccepted(data);
      break;

    case 'payment.completed':
      await handlePaymentCompleted(data);
      break;

    default:
      console.warn(`⚠️  Unknown routing key: ${routingKey}`);
  }
};

// ─── Start Consuming Messages ─────────────────────────────
const startConsumer = async () => {
  const channel = getChannel();

  if (!channel) {
    console.error('❌ Cannot start consumer — no RabbitMQ channel');
    return;
  }

  // Process one message at a time
  // Prevents overwhelming Twilio API
  channel.prefetch(1);

  console.log(`👂 Listening on queue: ${config.rabbitmq.queue}`);

  channel.consume(
    config.rabbitmq.queue,
    async (message) => {
      if (!message) return;

      try {
        const routingKey = message.fields.routingKey;
        const data = JSON.parse(message.content.toString());

        console.log(`📩 Received [${routingKey}]:`, JSON.stringify(data));

        await processMessage(routingKey, data);

        // Acknowledge message — remove from queue
        channel.ack(message);
        console.log(`✅ Message acknowledged: ${routingKey}`);

      } catch (error) {
        console.error('❌ Message processing failed:', error.message);

        // Negative acknowledge — requeue message for retry
        // Second param false = do not requeue (avoid infinite loop on bad data)
        channel.nack(message, false, false);
        console.log('❌ Message rejected and discarded');
      }
    },
    { noAck: false }  // Manual acknowledgment mode
  );
};

module.exports = { startConsumer };
