const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');

// Place a bid (provider only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can place bids' });
    }

    const { jobId, amount, message } = req.body;
    
    if (!jobId || !amount) {
      return res.status(400).json({ message: 'Job ID and amount are required' });
    }

    // Check if job exists and is open
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.status !== 'open') {
      return res.status(400).json({ message: 'Job is no longer accepting bids' });
    }

    // Check if provider already bid on this job
    const existingBid = await Bid.findOne({ jobId, providerId: req.user._id });
    if (existingBid) {
      return res.status(400).json({ message: 'You have already placed a bid on this job' });
    }

    const bid = new Bid({
      jobId,
      providerId: req.user._id,
      amount,
      message: message || ''
    });

    await bid.save();
    await bid.populate('providerId', 'name phone profilePhoto bio skills');
    await bid.populate('jobId', 'title');

    res.status(201).json(bid);
  } catch (error) {
    res.status(500).json({ message: 'Error placing bid', error: error.message });
  }
});

// Get all bids for a job (seeker view)
router.get('/job/:jobId', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Only job owner can view bids
    if (job.seekerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const bids = await Bid.find({ jobId: req.params.jobId })
      .populate('providerId', 'name phone profilePhoto bio skills')
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
      .populate('jobId')
      .populate('providerId', 'name phone profilePhoto')
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bids', error: error.message });
  }
});

// Accept a bid (seeker only)
router.patch('/:id/accept', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ message: 'Only seekers can accept bids' });
    }

    const bid = await Bid.findById(req.params.id).populate('jobId');
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    // Verify the job belongs to the seeker
    if (bid.jobId.seekerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Verify job is still open
    if (bid.jobId.status !== 'open') {
      return res.status(400).json({ message: 'Job is no longer accepting bids' });
    }

    // Accept this bid
    bid.status = 'accepted';
    await bid.save();

    // Reject all other bids for this job
    await Bid.updateMany(
      { jobId: bid.jobId._id, _id: { $ne: bid._id } },
      { status: 'rejected' }
    );

    // Update job status to active and store accepted bid
    await Job.findByIdAndUpdate(bid.jobId._id, {
      status: 'active',
      acceptedBidId: bid._id
    });

    await bid.populate('providerId', 'name phone profilePhoto bio skills');

    res.json({ bid, message: 'Bid accepted. Proceed to payment.' });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting bid', error: error.message });
  }
});

module.exports = router;