'use strict';

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const authMiddleware = require('../middleware/auth');
const bidServiceClient = require('../clients/bidServiceClient');
const jobServiceClient = require('../clients/jobServiceClient');
const config = require('../config');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret
});

// ─── Create Razorpay Order ────────────────────────────────
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ message: 'Only seekers can make payments' });
    }

    const { bidId } = req.body;

    if (!bidId) {
      return res.status(400).json({ message: 'Bid ID is required' });
    }

    // Idempotency check — prevent duplicate orders for same bid
    const existingPayment = await Payment.findOne({
      bidId,
      status: { $in: ['pending', 'paid'] }
    });

    if (existingPayment) {
      // Return existing order instead of creating new one
      return res.json({
        orderId: existingPayment.razorpayOrderId,
        amount: existingPayment.amount * 100,
        currency: 'INR',
        keyId: config.razorpay.keyId
      });
    }

    // Fetch bid details from bid-service
    const { data: bid, error: bidError } = await bidServiceClient.getBid(bidId);

    if (bidError) {
      return res.status(503).json({ message: bidError });
    }

    // Verify bid is accepted
    if (bid.status !== 'accepted') {
      return res.status(400).json({
        message: 'Bid must be accepted before payment'
      });
    }

    // Fetch job details from job-service
    const { data: job, error: jobError } = await jobServiceClient.getJob(bid.jobId);

    if (jobError) {
      return res.status(503).json({ message: jobError });
    }

    // Verify job belongs to this seeker
    if (job.seekerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: bid.amount * 100, // paise
      currency: 'INR',
      receipt: `bid_${bidId}_${Date.now()}`
    });

    // Save payment record
    const payment = new Payment({
      jobId: job._id,
      seekerId: req.user._id,
      providerId: bid.providerId,
      bidId: bid._id,
      razorpayOrderId: order.id,
      amount: bid.amount,
      status: 'pending'
    });

    await payment.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.razorpay.keyId
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating order',
      error: error.message
    });
  }
});

// ─── Verify Payment ───────────────────────────────────────
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        message: 'Missing payment verification data'
      });
    }

    // Idempotency check — prevent double verification
    const existingPayment = await Payment.findOne({
      razorpayOrderId,
      status: 'paid'
    });

    if (existingPayment) {
      return res.json({
        message: 'Payment already verified',
        payment: existingPayment
      });
    }

    // Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
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

    res.json({
      message: 'Payment verified successfully',
      payment
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error verifying payment',
      error: error.message
    });
  }
});

module.exports = router;
