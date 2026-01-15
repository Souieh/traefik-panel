import { authService } from '@/services/auth';
import type { LoginRequest, User } from '@/types/auth';
import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';

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
        try {
          const userData = await authService.getProfile();
          setUser(userData);
        } catch (error) {
          // Interceptors in api.ts will handle redirects for errors.
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (data: LoginRequest) => {
    await authService.login(data);
    const userData = await authService.getProfile();
    setUser(userData);
  };

  const logout = async () => {
    await authService.logout();
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
