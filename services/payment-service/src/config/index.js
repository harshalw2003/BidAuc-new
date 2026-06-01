'use strict';

const config = {
  port: process.env.PORT || 3005,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.MONGO_URL || 'mongodb://localhost:27017',
    name: process.env.DB_NAME || 'payment_service_db'
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
  },

  services: {
    bidServiceUrl: process.env.BID_SERVICE_URL || 'http://localhost:3004',
    jobServiceUrl: process.env.JOB_SERVICE_URL || 'http://localhost:3003'
  },

  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',')
  }
};

const requiredEnvVars = [
  'JWT_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'BID_SERVICE_URL',
  'JOB_SERVICE_URL'
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.warn(`WARNING: Environment variable ${varName} is not set`);
  }
});

module.exports = config;
