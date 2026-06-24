'use strict';

const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';

// Log the URL at startup so misconfiguration is immediately visible
console.log(`🔗 Job Service: User Service URL = ${USER_SERVICE_URL}`);

const userServiceAxios = axios.create({
  baseURL: USER_SERVICE_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

const userServiceClient = {

  async getUser(userId) {
    try {
      const response = await userServiceAxios.get(`/api/users/${userId}`);
      return { data: response.data, error: null };
    } catch (error) {
      console.error(`❌ Job Service: Failed to fetch user ${userId}:`, error.message);
      return {
        data: null,
        error: error.response?.data?.message || 'User service unavailable'
      };
    }
  },

  async getUsers(userIds) {
    try {
      // Fetch multiple users in parallel
      const promises = userIds.map(id => userServiceAxios.get(`/api/users/${id}`));
      const responses = await Promise.allSettled(promises);

      const users = {};
      responses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          users[userIds[index]] = result.value.data;
        } else {
          // Log individual failures so we know which user IDs are failing
          console.error(
            `❌ Job Service: Failed to fetch user ${userIds[index]}:`,
            result.reason?.message || 'Unknown error'
          );
        }
      });

      console.log(`📦 Job Service: Fetched ${Object.keys(users).length}/${userIds.length} users from user-service`);

      return { data: users, error: null };
    } catch (error) {
      console.error('❌ Job Service: getUsers failed:', error.message);
      return { data: {}, error: error.message };
    }
  }

};

module.exports = userServiceClient;