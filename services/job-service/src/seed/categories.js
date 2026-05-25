'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Category = require('../models/Category');
const categoryData = require('./data/categories.json');
const config = require('../config');

const categories = categoryData
  .filter(cat => cat.categoryName && cat.image)
  .map(cat => ({
    name: cat.categoryName,
    icon: cat.image,
    description: cat.description || cat.categoryName
  }));

const seedCategories = async () => {
  try {
    await mongoose.connect(`${config.database.url}/${config.database.name}`);
    console.log('✅ Connected to database for seeding');

    const count = await Category.countDocuments();

    if (count === 0) {
      await Category.insertMany(categories);
      console.log(`✅ Seeded ${categories.length} categories`);
    } else {
      console.log(`ℹ️  Categories already seeded (${count} found), skipping`);
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  }
};

seedCategories();
