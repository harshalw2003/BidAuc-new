const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Get all categories
router.get('/', async (req, res) => {
  try {
    // console.log('Fetching categories from database...');
    const categories = await Category.find();
    // console.log('Fetched categories:', categories);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

module.exports = router;