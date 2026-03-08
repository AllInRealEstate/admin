// src/services/api.js
import axios from 'axios';
import { authSync } from '../utils/authSync';

//  
const API_BASE_URL =import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor: No-cache headers
api.interceptors.request.use((config) => {
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  config.headers['Expires'] = '0';
  return config;
});

let isHandlingAuthError = false;
let hasSuccessfullyAuthenticated = false;

// Mark that the session was valid at least once
api.interceptors.response.use(
  (response) => {
    if (response.config.url?.includes('/admin/me')) {
      hasSuccessfullyAuthenticated = true;
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;

    // Handle both expired session (401) and suspended/forbidden (403)
    if ((status === 401 || status === 403) && !isHandlingAuthError) {
      isHandlingAuthError = true;

      // Only broadcast if the user was authenticated before (prevents login-loop noise)
      if (hasSuccessfullyAuthenticated) {
        authSync.broadcast('SESSION_EXPIRED', { status }, false);
      }

      // Redirect to login
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }

      // allow future handling after redirect starts
      setTimeout(() => {
        isHandlingAuthError = false;
      }, 1000);
    }

    return Promise.reject(error);
  }
);

export default api;