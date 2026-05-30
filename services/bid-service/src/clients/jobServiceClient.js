'use strict';

const axios = require('axios');
const config = require('../config');

// Create axios instance with base config
const jobServiceAxios = axios.create({
  baseURL: config.services.jobServiceUrl,
  timeout: 5000, // 5 second timeout — never wait forever
  headers: {
    'Content-Type': 'application/json'
  }
});

// ─── Job Service Client ───────────────────────────────────

const jobServiceClient = {

  // Get job by ID
  async getJob(jobId) {
    try {
      const response = await jobServiceAxios.get(`/api/jobs/${jobId}`);
      return { data: response.data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error.response?.data?.message || 'Job service unavailable'
      };
    }
  },

  // Update job status — internal call
  async updateJobStatus(jobId, status, acceptedBidId = null) {
    try {
      const payload = { status };
      if (acceptedBidId) payload.acceptedBidId = acceptedBidId;

      const response = await jobServiceAxios.patch(
        `/api/jobs/${jobId}/status`,
        payload
      );
      return { data: response.data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error.response?.data?.message || 'Job service unavailable'
      };
    }
  }
};

module.exports = jobServiceClient;
