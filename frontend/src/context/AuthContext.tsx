import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, SignupPayload, LoginPayload } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  signup: (payload: SignupPayload) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check active session on initial load
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const { user: currentUser } = await authService.getMe();
        if (isMounted) setUser(currentUser);
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    if (res.data?.token) {
      localStorage.setItem('mmm_token', res.data.token);
    }
    setUser(res.data.user);
    return res.data.user;
  };

  const signup = async (payload: SignupPayload) => {
    const res = await authService.signup(payload);
    if (res.data?.token) {
      localStorage.setItem('mmm_token', res.data.token);
    }
    setUser(res.data.user);
    return res.data.user;
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await authService.googleLogin(credential);
    if (res.data?.token) {
      localStorage.setItem('mmm_token', res.data.token);
    }
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('mmm_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
