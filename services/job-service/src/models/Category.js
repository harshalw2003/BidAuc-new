'use strict';

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  icon: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Category', categorySchema);
