import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
// const API_URL = 'http://localhost:8001';


const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - do not auto-redirect to the login page.
      // Let the app's auth logic handle session state and navigation.
      // Log for debugging purposes.
      // Example: components can catch this error and prompt user to login.
      // Avoid forcing navigation here to keep public pages (home) accessible.
      // eslint-disable-next-line no-console
      console.warn('API 401 Unauthorized for', error.config?.url);
    }
    return Promise.reject(error);
  }
);

export default api;