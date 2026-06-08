'use strict';

const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const authMiddleware = require('../middleware/auth');
const jobServiceClient = require('../clients/jobServiceClient');
const userServiceClient = require('../clients/userServiceClient');
const { publishEvent } = require('../config/rabbitmq');

// ─── Helper: Attach provider details to bids ──────────────
const attachProviderDetails = async (bids) => {
  if (!bids || bids.length === 0) return bids;

  const providerIds = [...new Set(bids.map(b => b.providerId.toString()))];
  const { data: usersMap } = await userServiceClient.getUsers(providerIds);

  return bids.map(bid => {
    const bidObj = bid.toObject();
    bidObj.providerId = usersMap[bid.providerId.toString()] || {
      _id: bid.providerId,
      name: 'Unknown Provider',
      phone: ''
    };
    return bidObj;
  });
};

// ─── Place a Bid — provider only ──────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can place bids' });
    }

    const { jobId, amount, message } = req.body;

    if (!jobId || !amount) {
      return res.status(400).json({ message: 'Job ID and amount are required' });
    }

    const { data: job, error: jobError } = await jobServiceClient.getJob(jobId);

    if (jobError) {
      return res.status(503).json({ message: jobError });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ message: 'Job is no longer accepting bids' });
    }

    const existingBid = await Bid.findOne({ jobId, providerId: req.user._id });
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

    // Attach provider details to response
    const [enrichedBid] = await attachProviderDetails([bid]);

    res.status(201).json(enrichedBid);
  } catch (error) {
    res.status(500).json({ message: 'Error placing bid', error: error.message });
  }
});

// ─── Get All Bids for a Job — seeker only ─────────────────
router.get('/job/:jobId', authMiddleware, async (req, res) => {
  try {
    const { data: job, error: jobError } = await jobServiceClient.getJob(
      req.params.jobId
    );

    if (jobError) {
      return res.status(503).json({ message: jobError });
    }

    // ─── FIXED: Handle both populated and unpopulated seekerId ──
    // job.seekerId can be either:
    // { _id: "...", name: "..." }  → populated object (after our fix)
    // "6a1ad2dc..."                → plain ObjectId string (before fix)
    const seekerId = job.seekerId?._id
      ? job.seekerId._id.toString()
      : job.seekerId.toString();

    if (seekerId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const bids = await Bid.find({ jobId: req.params.jobId })
      .sort({ createdAt: -1 });

    const enrichedBids = await attachProviderDetails(bids);

    res.json(enrichedBids);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bids', error: error.message });
  }
});

// ─── Get Provider's Own Bids ──────────────────────────────
router.get('/my', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can view their bids' });
    }

    const bids = await Bid.find({ providerId: req.user._id })
      .sort({ createdAt: -1 });

    const enrichedBids = await attachProviderDetails(bids);

    res.json(enrichedBids);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bids', error: error.message });
  }
});

// ─── Accept a Bid — seeker only ───────────────────────────
router.patch('/:id/accept', authMiddleware, async (req, res) => {
  try {
    // ... existing code ...

    const { data: job, error: jobError } = await jobServiceClient.getJob(bid.jobId);

    if (jobError) {
      return res.status(503).json({ message: jobError });
    }

    // ─── FIXED: Same populated object handling ──────────────
    const seekerId = job.seekerId?._id
      ? job.seekerId._id.toString()
      : job.seekerId.toString();

    if (seekerId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }


    if (job.status !== 'open') {
      return res.status(400).json({ message: 'Job is no longer accepting bids' });
    }

    bid.status = 'accepted';
    await bid.save();

    await Bid.updateMany(
      { jobId: bid.jobId, _id: { $ne: bid._id } },
      { status: 'rejected' }
    );

    const { error: updateError } = await jobServiceClient.updateJobStatus(
      bid.jobId,
      'active',
      bid._id
    );

    if (updateError) {
      console.error(
        `CRITICAL: Bid ${bid._id} accepted but job status update failed:`,
        updateError
      );
    }

    // Publish event to RabbitMQ
    publishEvent('bid.accepted', {
      bidId: bid._id,
      jobId: bid.jobId,
      providerId: bid.providerId,
      seekerId: req.user._id,
      amount: bid.amount,
      jobTitle: job.title
    });

    const [enrichedBid] = await attachProviderDetails([bid]);

    res.json({
      bid: enrichedBid,
      message: 'Bid accepted. Proceed to payment.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting bid', error: error.message });
  }
});

// ─── Internal: Get Single Bid ─────────────────────────────
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