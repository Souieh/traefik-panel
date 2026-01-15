export interface LoginRequest {
  username?: string;
  email?: string;
  password?: string;
}

export interface LoginResponseData {
  access_token: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  disabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChangePasswordRequest {
  old_password?: string;
  new_password?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password?: string;
}
