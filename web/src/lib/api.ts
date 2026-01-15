import { authService } from '@/services/auth';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 7000,
});

// Inject Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle Response Errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // Ignore health-check errors
    if (config?.url?.includes('/healthz')) {
      return Promise.reject(error);
    }

    // Handle 401 -> logout
    if (response?.status === 401 && config?.url?.includes('/auth')) {
      await authService.logout();
      window.location.replace('/auth/login');
      return Promise.reject(error);
    }

    // For other network errors / timeouts / 5xx -> redirect to ErrorPage
    if (!response || response.status >= 500 || error.code === 'ECONNABORTED') {
      // Use router redirect
      window.location.replace('/error/500?message=Could not connect to server.');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
