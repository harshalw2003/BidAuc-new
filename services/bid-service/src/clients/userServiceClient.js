'use strict';

const axios = require('axios');

const userServiceAxios = axios.create({
  baseURL: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

const userServiceClient = {

  async getUser(userId) {
    try {
      const response = await userServiceAxios.get(`/api/users/${userId}`);
      return { data: response.data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error.response?.data?.message || 'User service unavailable'
      };
    }
  },

  async getUsers(userIds) {
    try {
      const promises = userIds.map(id => userServiceAxios.get(`/api/users/${id}`));
      const responses = await Promise.allSettled(promises);

      const users = {};
      responses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          users[userIds[index]] = result.value.data;
        }
      });

      return { data: users, error: null };
    } catch (error) {
      return { data: {}, error: error.message };
    }
  }

};

module.exports = userServiceClient;
