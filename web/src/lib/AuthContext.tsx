import { authService } from '@/services/auth';
import type { LoginRequest, User } from '@/types/auth';
import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { setAuthToken } from './api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        setAuthToken(token);
        try {
          const userData = await authService.getProfile();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('access_token');
          setAuthToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (data: LoginRequest) => {
    const response = await authService.login(data);
    const { access_token: token } = response;
    localStorage.setItem('access_token', token);
    setAuthToken(token);
    try {
      const userData = await authService.getProfile();
      setUser(userData);
    } catch (error) {
      localStorage.removeItem('access_token');
      setAuthToken(null);
      setUser(null);
    }
  };

  const logout = async () => {
    await authService.logout();
    setAuthToken(null);
    setUser(null);
  };

  const value = { user, isAuthenticated: !!user, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
