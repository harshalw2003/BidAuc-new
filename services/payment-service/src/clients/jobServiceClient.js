'use strict';

const axios = require('axios');
const config = require('../config');

const jobServiceAxios = axios.create({
  baseURL: config.services.jobServiceUrl,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const jobServiceClient = {

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
  }
};

module.exports = jobServiceClient;
