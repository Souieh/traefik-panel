import api from "@/lib/api";
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
  User,
} from "@/types/auth";
// TODO: Add types decaltions

// Quick type definitions for this file if not global
export interface LoginResponseData {
  access_token: string;
}

export const authService = {
  login: async (data: LoginRequest) => {
    const response = await api.post<LoginResponseData>("/login", data);
    if (response.data.access_token) {
      localStorage.setItem("access_token", response.data.access_token);
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post("/logout");
    } finally {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
  },

  getProfile: async () => {
    const response = await api.get<User>("/users/me/");
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest) => {
    const response = await api.post("/change-password", data);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    const response = await api.post("/forgot-password", data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    const response = await api.post("/reset-password", data);
    return response.data;
  },
};
