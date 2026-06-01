const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const authMiddleware = require('../middleware/auth');
const twilio = require("twilio");
const otpClient = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_ACCOUNT_TOKEN);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// Send OTP
router.post('/send-otp', async (req, res) => {
  console.log('Received request to send OTP:', req.body);
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

   

    // Delete previous OTPs for this phone number
    await Otp.deleteMany({ phone });

    // Generate 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to database with 50-second expiration
    const otpRecord = new Otp({
      phone,
      otp,
      isUsed: false
    });
    
    await otpRecord.save();

     // Method to send the otp to phone number
    console.log('Preparing to send OTP to:', phone);
    // console.log(otpClient);

    // otpClient.messages
    // .create({
    //     body: 'Your OTP for BidAuc is: ' + otp,
    //     from: process.env.SEND_OTP_FROM_NUMBER,
    //     to: '+91' + phone
    // })
    // .then(message => console.log(message.sid));

  console.log(`OTP for ${phone}: ${otp} (This should be sent via SMS in production)`);
    // Return success message (don't expose OTP in production)
    res.json({ 
      message: 'OTP sent successfully',
      expiresIn: 50,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
});

// Verify OTP and Login/Register
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    // Find valid OTP in database
    const otpRecord = await Otp.findOne({ 
      phone, 
      otp,
      isUsed: false
    });

    // Check if OTP exists and is not expired
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark OTP as used (prevent reuse)
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Check if user exists
    let user = await User.findOne({ phone }).select('-password');
    
    if (user) {
      // Existing user - login
      const { accessToken, refreshToken } = generateTokens(user._id);
      
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      return res.json({ user, isNewUser: false });
    } else {
      // New user - needs to complete registration
      return res.json({ phone, isNewUser: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
});

// Complete registration for new users
router.post('/register', async (req, res) => {
  try {
    const { phone, name, role } = req.body;
    
    if (!phone || !name || !role) {
      return res.status(400).json({ message: 'Phone, name, and role are required' });
    }

    if (!['seeker', 'provider'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create password hash (using phone as password for phone auth)
    const hashedPassword = await bcrypt.hash(phone, 10);

    // Create new user
    const user = new User({
      phone,
      name,
      role,
      password: hashedPassword
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ user: userResponse });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Get current user
router.get('/me',   authMiddleware, async (req, res) => {
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

    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const accessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '15m' });
    
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({ message: 'Token refreshed' });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

module.exports = router;