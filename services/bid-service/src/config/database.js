'use strict';

const mongoose = require('mongoose');
const config = require('./index');

const connectDatabase = async () => {
  try {
    const connectionString = `${config.database.url}/${config.database.name}`;

    await mongoose.connect(connectionString);

    console.log(`✅ Bid Service: MongoDB connected to ${config.database.name}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  Bid Service: MongoDB disconnected');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ Bid Service: MongoDB error:', error.message);
    });

  } catch (error) {
    console.error('❌ Bid Service: MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDatabase;
