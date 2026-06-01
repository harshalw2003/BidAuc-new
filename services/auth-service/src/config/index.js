'use strict';

const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.MONGO_URL || 'mongodb://localhost:27017',
    name: process.env.DB_NAME || 'auth_service_db'
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
     accessExpiry: process.env.JWT_ACCESS_EXPIRY,  // ← verify this line exists
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY  // ← verify this line exists
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_ACCOUNT_TOKEN,
    fromNumber: process.env.SEND_OTP_FROM_NUMBER
  },

  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',')
  }
};

// Validate critical config at startup
const requiredEnvVars = ['JWT_SECRET'];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.warn(`WARNING: Environment variable ${varName} is not set`);
  }
});

module.exports = config;
