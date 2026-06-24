'use strict';

const config = {
  port: process.env.PORT || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.MONGO_URL || 'mongodb://localhost:27017',
    name: process.env.DB_NAME || 'user_service_db'
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  },

  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',')
  }
};

const requiredEnvVars = ['JWT_SECRET'];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.warn(`WARNING: Environment variable ${varName} is not set`);
  }
});

module.exports = config;
