'use strict';

const mongoose = require('mongoose');
const config = require('./index');

const connectDatabase = async () => {
  try {
    const connectionString = `${config.database.url}/${config.database.name}`;

    await mongoose.connect(connectionString);

    console.log(`✅ User Service: MongoDB connected to ${config.database.name}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  User Service: MongoDB disconnected');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ User Service: MongoDB error:', error.message);
    });

  } catch (error) {
    console.error('❌ User Service: MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDatabase;
