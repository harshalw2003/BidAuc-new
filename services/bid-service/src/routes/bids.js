'use strict';

const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const authMiddleware = require('../middleware/auth');
const jobServiceClient = require('../clients/jobServiceClient');

// Place a bid — provider only
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can place bids' });
    }

    const { jobId, amount, message } = req.body;

    if (!jobId || !amount) {
      return res.status(400).json({ message: 'Job ID and amount are required' });
    }

    // Verify job exists and is open via job-service
    const { data: job, error: jobError } = await jobServiceClient.getJob(jobId);

    if (jobError) {
      return res.status(503).json({ message: jobError });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ message: 'Job is no longer accepting bids' });
    }

    // Check if provider already bid on this job
    const existingBid = await Bid.findOne({
      jobId,
      providerId: req.user._id
    });

    if (existingBid) {
      return res.status(400).json({
        message: 'You have already placed a bid on this job'
      });
    }

    const bid = new Bid({
      jobId,
      providerId: req.user._id,
      amount,
      message: message || ''
    });

    await bid.save();

    res.status(201).json(bid);
  } catch (error) {
    res.status(500).json({ message: 'Error placing bid', error: error.message });
  }
});

// Get all bids for a job — seeker only
router.get('/job/:jobId', authMiddleware, async (req, res) => {
  try {
    // Verify job belongs to this seeker
    const { data: job, error: jobError } = await jobServiceClient.getJob(
      req.params.jobId
    );

    if (jobError) {
      return res.status(503).json({ message: jobError });
    }

    if (job.seekerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const bids = await Bid.find({ jobId: req.params.jobId })
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bids', error: error.message });
  }
});

// Get provider's own bids
router.get('/my', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can view their bids' });
    }

    const bids = await Bid.find({ providerId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bids', error: error.message });
  }
});

// Accept a bid — seeker only
router.patch('/:id/accept', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ message: 'Only seekers can accept bids' });
    }

    const bid = await Bid.findById(req.params.id);
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    // Verify job exists and belongs to this seeker
    const { data: job, error: jobError } = await jobServiceClient.getJob(
      bid.jobId
    );

    if (jobError) {
      return res.status(503).json({ message: jobError });
    }

    if (job.seekerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ message: 'Job is no longer accepting bids' });
    }

    // Accept this bid
    bid.status = 'accepted';
    await bid.save();

    // Reject all other bids for this job
    await Bid.updateMany(
      { jobId: bid.jobId, _id: { $ne: bid._id } },
      { status: 'rejected' }
    );

    // Update job status via job-service
    const { error: updateError } = await jobServiceClient.updateJobStatus(
      bid.jobId,
      'active',
      bid._id
    );

    if (updateError) {
      // Critical: bid accepted but job status not updated
      // Log this for manual intervention
      // In Phase 2 this becomes a RabbitMQ event for reliability
      console.error(
        `CRITICAL: Bid ${bid._id} accepted but job ${bid.jobId} status update failed:`,
        updateError
      );
    }

    res.json({
      bid,
      message: 'Bid accepted. Proceed to payment.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting bid', error: error.message });
  }
});

// Internal route — called by payment-service
router.get('/:id', async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    res.json(bid);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bid', error: error.message });
  }
});

module.exports = router;
