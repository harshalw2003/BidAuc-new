'use strict';

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Add publisher to user-service
const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'marketplace_events';

let channel = null;

// Initialize publisher
(async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    console.log('✅ User Service: Publisher connected');
  } catch (error) {
    console.error('❌ User Service publisher failed:', error.message);
  }
})();

const publishEvent = (routingKey, data) => {
  try {
    if (!channel) return;
    channel.publish(
      EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(data)),
      { persistent: true }
    );
  } catch (error) {
    console.error('❌ Publish failed:', error.message);
  }
};

// ─── Get User By ID ───────────────────────────────────────
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

// ─── Update User Profile ──────────────────────────────────
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

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

    // Publish profile update event
    // auth-service can consume this to keep its DB in sync
    publishEvent('user.updated', {
      _id: user._id,
      name: user.name,
      profilePhoto: user.profilePhoto,
      address: user.address,
      bio: user.bio,
      skills: user.skills
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

module.exports = router;