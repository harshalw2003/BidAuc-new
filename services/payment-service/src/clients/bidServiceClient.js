'use strict';

const axios = require('axios');
const config = require('../config');

const bidServiceAxios = axios.create({
  baseURL: config.services.bidServiceUrl,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const bidServiceClient = {

  async getBid(bidId) {
    try {
      const response = await bidServiceAxios.get(`/api/bids/${bidId}`);
      return { data: response.data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error.response?.data?.message || 'Bid service unavailable'
      };
    }
  }
};

module.exports = bidServiceClient;
