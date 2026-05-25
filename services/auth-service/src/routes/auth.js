'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const User = require('../models/User');
const Otp = require('../models/Otp');
const authMiddleware = require('../middleware/auth');
const config = require('../config');

const otpClient = new twilio(
  config.twilio.accountSid,
  config.twilio.authToken
);

// ─── Helpers ─────────────────────────────────────────────

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiry }
  );
  const refreshToken = jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiry }
  );
  return { accessToken, refreshToken };
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const sendSMS = async (to, body) => {
  try {
    await otpClient.messages.create({
      from: config.twilio.fromNumber,
      to: `+91${to}`,
      body
    });
  } catch (error) {
    console.error('SMS send failed:', error.message);
  }
};

// ─── Routes ──────────────────────────────────────────────

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    await Otp.deleteMany({ phone });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await new Otp({ phone, otp, isUsed: false }).save();

    await sendSMS(phone, `Your OTP is: ${otp}`);

    console.log(`OTP for ${phone}: ${otp}`);

    res.json({
      message: 'OTP sent successfully',
      expiresIn: 50,
      otp: config.nodeEnv === 'development' ? otp : undefined
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const otpRecord = await Otp.findOne({ phone, otp, isUsed: false });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    const user = await User.findOne({ phone }).select('-password');

    if (user) {
      const { accessToken, refreshToken } = generateTokens(user._id);
      setTokenCookies(res, accessToken, refreshToken);
      return res.json({ user, isNewUser: false });
    }

    return res.json({ phone, isNewUser: true });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { phone, name, role } = req.body;

    if (!phone || !name || !role) {
      return res.status(400).json({ message: 'Phone, name, and role are required' });
    }

    if (!['seeker', 'provider'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(phone, 10);

    const user = new User({ phone, name, role, password: hashedPassword });
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);
    setTokenCookies(res, accessToken, refreshToken);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ user: userResponse });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.json({ message: 'Logged out successfully' });
});

// Refresh token
router.post('/refresh', (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    const decoded = jwt.verify(refreshToken, config.jwt.secret);
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpiry }
    );

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.json({ message: 'Token refreshed' });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

module.exports = router;