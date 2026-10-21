import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

/**
 * Pre-configured Axios instance for future REST backend integration.
 * Includes token injection and standardized error normalization.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pulsechat_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Standardize responses and handle common HTTP error codes
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const errorResponse = {
      message: 'An unexpected error occurred. Please try again.',
      status: error.response?.status || 500,
      data: error.response?.data || null,
    };

    if (error.response) {
      if (error.response.status === 401) {
        errorResponse.message = 'Session expired. Please log in again.';
        // Clear expired credentials
        localStorage.removeItem('pulsechat_token');
        localStorage.removeItem('pulsechat_user');
      } else if (error.response.status === 403) {
        errorResponse.message = 'You do not have permission to perform this action.';
      } else if (error.response.status === 404) {
        errorResponse.message = 'The requested resource was not found.';
      } else if (error.response.data?.message) {
        errorResponse.message = error.response.data.message;
      }
    } else if (error.request) {
      errorResponse.message = 'Unable to reach the server. Please check your network connection.';
    }

    return Promise.reject(errorResponse);
  }
);

export default api;
