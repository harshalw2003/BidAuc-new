'use strict';

const config = {
  port: process.env.PORT || 3004,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.MONGO_URL || 'mongodb://localhost:27017',
    name: process.env.DB_NAME || 'bid_service_db'
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  },

  services: {
    jobServiceUrl: process.env.JOB_SERVICE_URL || 'http://localhost:3003'
  },

  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',')
  }
};

const requiredEnvVars = ['JWT_SECRET', 'JOB_SERVICE_URL'];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.warn(`WARNING: Environment variable ${varName} is not set`);
  }
});

module.exports = config;
