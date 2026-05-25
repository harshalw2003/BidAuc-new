'use strict';

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Update user profile
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // User can only update their own profile
    if (req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { name, address, profilePhoto, bio, skills } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;
    if (bio !== undefined) updateData.bio = bio;
    if (skills) updateData.skills = skills;

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

module.exports = router;