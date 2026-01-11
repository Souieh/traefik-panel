import { authService } from "@/services/auth";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 7000,
});

// 1. Inject Token into every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Handle Session Expiry (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // When a request fails with 401, it means the token is likely expired or invalid.
    // We trigger a logout, which will clear credentials and redirect to the login page.
    if (
      error.response?.status === 401 &&
      error.config.url !== "/logout" &&
      window.location.pathname !== "/login"
    ) {
      // The logout service will attempt to call the logout endpoint,
      // clear the local token, and redirect to the login page for the user to authenticate again.
      await authService.logout();
      window.location.replace("/login");
    }
    return Promise.reject(error);
  }
);

export default api;
