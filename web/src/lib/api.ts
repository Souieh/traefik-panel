import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 7000,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (config?.url?.includes('/healthz')) {
      return Promise.reject(error);
    }

    if (response?.status === 401 && !config?.url?.includes('/login')) {
      // The AuthContext will handle the logout and redirect.
      return Promise.reject(error);
    }

    if (!response || response.status >= 500 || error.code === 'ECONNABORTED') {
      window.location.replace('/error/500?message=Could not connect to server.');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
