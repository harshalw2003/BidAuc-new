'use strict';

const User = require('../models/User');

const handleUserRegistered = async (data) => {
  try {
    // Upsert — insert if not exists, update if exists
    // This handles both new users and backfill of existing users
    await User.findOneAndUpdate(
      { _id: data._id },
      {
        $set: {
          name: data.name,
          phone: data.phone,
          password: data.phone,
          role: data.role,
          profilePhoto: data.profilePhoto || '',
          address: data.address || '',
          bio: data.bio || '',
          skills: data.skills || [],
          createdAt: data.createdAt
        }
      },
      {
        upsert: true,    // create if not exists
        new: true,       // return updated document
        setDefaultsOnInsert: true
      }
    );

    console.log(`✅ User ${data._id} (${data.name}) synced to user-service DB`);
  } catch (error) {
    console.error('❌ Failed to sync user:', error.message);
    throw error;
  }
};

const handleUserUpdated = async (data) => {
  try {
    await User.findOneAndUpdate(
      { _id: data._id },
      {
        $set: {
          name: data.name,
          profilePhoto: data.profilePhoto || '',
          address: data.address || '',
          bio: data.bio || '',
          skills: data.skills || []
        }
      },
      { new: true }
    );

    console.log(`✅ User ${data._id} profile updated in user-service DB`);
  } catch (error) {
    console.error('❌ Failed to update user:', error.message);
    throw error;
  }
};

module.exports = { handleUserRegistered, handleUserUpdated };