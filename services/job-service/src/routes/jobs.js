'use strict';

const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');
const userServiceClient = require('../clients/userServiceClient');

// ─── Helper: Attach seeker details to jobs ────────────────
const attachSeekerDetails = async (jobs) => {
  if (!jobs || jobs.length === 0) return jobs;

  // Get unique seeker IDs
  const seekerIds = [...new Set(jobs.map(j => j.seekerId.toString()))];

  // Fetch all seekers in parallel
  const { data: usersMap } = await userServiceClient.getUsers(seekerIds);
  console.log('Fetched seeker details for jobs:', usersMap);

  // Attach seeker data to each job
  return jobs.map(job => {
    const jobObj = job.toObject();
    console.log("Job with seeker details:", jobObj);
    jobObj.seekerId = usersMap[job.seekerId.toString()] || {
      _id: job.seekerId,
      name: 'Unknown',
      phone: ''
    };
    return jobObj;
  });
};

// ─── Create Job — seeker only ─────────────────────────────
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

    // Attach seeker details
    const [enrichedJob] = await attachSeekerDetails([job]);

    res.status(201).json(enrichedJob);
  } catch (error) {
    res.status(500).json({ message: 'Error creating job', error: error.message });
  }
});

// ─── Get All Open Jobs ────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { categoryId, status } = req.query;

    const filter = {};
    if (categoryId) filter.categoryId = categoryId;
    filter.status = status || 'open';

    const jobs = await Job.find(filter)
      .populate('categoryId', 'name icon')
      .sort({ createdAt: -1 });

    const enrichedJobs = await attachSeekerDetails(jobs);

    res.json(enrichedJobs);
    console.log('Enriched jobs:', enrichedJobs);
    
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
});

// ─── Get Seeker's Own Jobs ────────────────────────────────
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

    const enrichedJobs = await attachSeekerDetails(jobs);

    res.json(enrichedJobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
});

// ─── Get Provider's Active Jobs ───────────────────────────
router.get('/active', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Only providers can view active jobs' });
    }

    const { status } = req.query;

    const jobs = await Job.find({ status: status || 'active' })
      .populate('categoryId', 'name icon')
      .sort({ createdAt: -1 });

    const enrichedJobs = await attachSeekerDetails(jobs);

    res.json(enrichedJobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active jobs', error: error.message });
  }
});

// ─── Get Single Job ───────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('categoryId', 'name icon');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const [enrichedJob] = await attachSeekerDetails([job]);

    res.json(enrichedJob);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job', error: error.message });
  }
});

// ─── Mark Job Complete — provider only ───────────────────
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

    const [enrichedJob] = await attachSeekerDetails([job]);

    res.json(enrichedJob);
  } catch (error) {
    res.status(500).json({ message: 'Error completing job', error: error.message });
  }
});

// ─── Internal: Update Job Status ──────────────────────────
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