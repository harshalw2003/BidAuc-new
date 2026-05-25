const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');

// Create job (seeker only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ message: 'Only seekers can post jobs' });
    }

    const { title, categoryId, description, location, budget } = req.body;
    
    if (!title || !categoryId || !description || !location || !budget) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const job = new Job({
      seekerId: req.user._id,
      title,
      categoryId,
      description,
      location,
      budget,
      status: 'open'
    });

    await job.save();
    await job.populate('categoryId', 'name icon');
    await job.populate('seekerId', 'name phone profilePhoto');

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error creating job', error: error.message });
  }
});

// Get all open jobs (for providers to browse)
router.get('/', async (req, res) => {
  try {
    const { categoryId, status } = req.query;
    
    const filter = {};
    if (categoryId) filter.categoryId = categoryId;
    if (status) filter.status = status;
    else filter.status = 'open'; // Default to open jobs

    const jobs = await Job.find(filter)
      .populate('categoryId', 'name icon')
      .populate('seekerId', 'name phone profilePhoto')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
});

// Get user's own jobs (seeker's posted jobs)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'seeker') {
      return res.status(403).json({ message: 'Only seekers can view their posted jobs' });
    }

    const { status } = req.query;
    const filter = { seekerId: req.user._id };
    if (status) filter.status = status;

    const jobs = await Job.find(filter)
      .populate('categoryId', 'name icon')
      .populate('seekerId', 'name phone profilePhoto')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
});

// Get provider's active jobs
router.get('/active', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can view active jobs' });
    }

    const Bid = require('../models/Bid');
    
    // Find all accepted bids by this provider
    const acceptedBids = await Bid.find({
      providerId: req.user._id,
      status: 'accepted'
    }).select('jobId');

    const jobIds = acceptedBids.map(bid => bid.jobId);

    const jobs = await Job.find({ _id: { $in: jobIds } })
      .populate('categoryId', 'name icon')
      .populate('seekerId', 'name phone profilePhoto')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active jobs', error: error.message });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('categoryId', 'name icon')
      .populate('seekerId', 'name phone profilePhoto address');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job', error: error.message });
  }
});

// Mark job as complete (provider only)
router.patch('/:id/complete', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can mark jobs as complete' });
    }

    const Bid = require('../models/Bid');
    
    // Check if provider has an accepted bid for this job
    const acceptedBid = await Bid.findOne({
      jobId: req.params.id,
      providerId: req.user._id,
      status: 'accepted'
    });

    if (!acceptedBid) {
      return res.status(403).json({ message: 'You are not assigned to this job' });
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    )
      .populate('categoryId', 'name icon')
      .populate('seekerId', 'name phone profilePhoto');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error completing job', error: error.message });
  }
});

module.exports = router;