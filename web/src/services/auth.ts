import api from '@/lib/api';
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponseData,
  ResetPasswordRequest,
  User,
} from '@/types/auth';

export const authService = {
  login: async (data: LoginRequest) => {
    const response = await api.post<LoginResponseData>('/login', data);
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/logout');
    } finally {
      localStorage.removeItem('access_token');
    }
  },

  getProfile: async () => {
    const response = await api.get<User>('/users/me/');
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest) => {
    const response = await api.post('/change-password', data);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    const response = await api.post('/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    const response = await api.post('/reset-password', data);
    return response.data;
  },
};
