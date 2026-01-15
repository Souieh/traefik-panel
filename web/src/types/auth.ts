export interface User {
  lastLogin: string | null;
  createdAt: string | null;
  username: string;
  email: string | null;
  full_name: string | null;
  disabled: boolean | null;
  role: "admin" | "operator";
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}
