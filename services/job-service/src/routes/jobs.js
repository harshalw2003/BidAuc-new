'use strict';

const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');

// Create job — seeker only
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

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error creating job', error: error.message });
  }
});

// Get all open jobs — public
router.get('/', async (req, res) => {
  try {
    const { categoryId, status } = req.query;

    const filter = {};
    if (categoryId) filter.categoryId = categoryId;
    filter.status = status || 'open';

    const jobs = await Job.find(filter)
      .populate('categoryId', 'name icon')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
});

// Get seeker's own jobs
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

    // Internal call to bid-service to get accepted bid job IDs
    // For now we query jobs with status active where acceptedBidId exists
    // This will be replaced with proper inter-service call in Phase 2
    const { status } = req.query;

    const jobs = await Job.find({
      status: status || 'active'
    })
      .populate('categoryId', 'name icon')
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
      .populate('categoryId', 'name icon');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job', error: error.message });
  }
});

// Mark job complete — provider only
router.patch('/:id/complete', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can mark jobs as complete' });
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    ).populate('categoryId', 'name icon');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error completing job', error: error.message });
  }
});

// Internal route — called by bid-service to update job status
// Not exposed through API gateway to public
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, acceptedBidId } = req.body;

    const updateData = { status };
    if (acceptedBidId) updateData.acceptedBidId = acceptedBidId;

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Error updating job status', error: error.message });
  }
});

module.exports = router;
