'use strict';

const User = require('../models/User');

const handleUserRegistered = async (data) => {
  try {
    // Check if user already exists — idempotency
    const existingUser = await User.findById(data._id);

    if (existingUser) {
      console.log(`ℹ️  User ${data._id} already exists in user-service DB`);
      return;
    }

    // Create user in user-service database
    const user = new User({
      _id: data._id,
      name: data.name,
      phone: data.phone,
      password: data.phone, // placeholder — user-service never authenticates
      role: data.role,
      profilePhoto: data.profilePhoto || '',
      address: data.address || '',
      bio: data.bio || '',
      skills: data.skills || [],
      createdAt: data.createdAt
    });

    await user.save();
    console.log(`✅ User ${data._id} synced to user-service DB`);

  } catch (error) {
    console.error('❌ Failed to sync user:', error.message);
    throw error; // Rethrow so message gets nacked and retried
  }
};

module.exports = { handleUserRegistered };
