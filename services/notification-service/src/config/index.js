'use strict';

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'marketplace_events',
    queue: process.env.RABBITMQ_QUEUE || 'notification_queue',
    // Routing keys this service listens to
    routingKeys: [
      'bid.accepted',
      'payment.completed'
    ]
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_ACCOUNT_TOKEN,
    fromNumber: process.env.SEND_OTP_FROM_NUMBER
  }
};

const requiredEnvVars = [
  'RABBITMQ_URL',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_ACCOUNT_TOKEN',
  'SEND_OTP_FROM_NUMBER'
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.warn(`WARNING: Environment variable ${varName} is not set`);
  }
});

module.exports = config;
