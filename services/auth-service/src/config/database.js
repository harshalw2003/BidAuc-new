'use strict';

const mongoose = require('mongoose');
const config = require('./index');

const connectDatabase = async () => {
  try {
    const connectionString = `${config.database.url}/${config.database.name}`;

    await mongoose.connect(connectionString);

    console.log(`✅ Auth Service: MongoDB connected to ${config.database.name}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  Auth Service: MongoDB disconnected');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ Auth Service: MongoDB error:', error.message);
    });

  } catch (error) {
    console.error('❌ Auth Service: MongoDB connection failed:', error.message);
    // Exit process — service cannot run without database
    process.exit(1);
  }
};

module.exports = connectDatabase;
