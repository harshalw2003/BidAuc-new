const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Job = require('../models/Job');
const Bid = require('../models/Bid');
const authMiddleware = require('../middleware/auth');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

// Create Razorpay order
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ message: 'Only seekers can make payments' });
    }

    const { bidId } = req.body;
    
    if (!bidId) {
      return res.status(400).json({ message: 'Bid ID is required' });
    }

    // Get the bid details
    const bid = await Bid.findById(bidId).populate('jobId');
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    // Verify bid is accepted
    if (bid.status !== 'accepted') {
      return res.status(400).json({ message: 'Bid must be accepted before payment' });
    }

    // Verify the job belongs to the seeker
    if (bid.jobId.seekerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Create Razorpay order
    const options = {
      amount: bid.amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `bid_${bidId}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    // Create payment record
    const payment = new Payment({
      jobId: bid.jobId._id,
      seekerId: req.user._id,
      providerId: bid.providerId,
      razorpayOrderId: order.id,
      amount: bid.amount,
      status: 'pending'
    });

    await payment.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// Verify payment
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: 'Missing payment verification data' });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId },
      {
        razorpayPaymentId,
        status: 'paid'
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Job status remains 'active' until provider marks it complete
    // No need to update job status here as it was already set to 'active' when bid was accepted

    res.json({ message: 'Payment verified successfully', payment });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
});

module.exports = router;