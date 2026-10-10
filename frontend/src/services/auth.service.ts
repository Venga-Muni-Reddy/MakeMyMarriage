import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  preferredLanguage: string;
  avatarUrl?: string | null;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  preferredLanguage?: 'en' | 'hi' | 'te';
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    token?: string;
  };
}

export const authService = {
  async signup(payload: SignupPayload): Promise<AuthResponse> {
    return api.post('/auth/signup', payload);
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    return api.post('/auth/login', payload);
  },

  async googleLogin(credential: string): Promise<AuthResponse> {
    return api.post('/auth/google', { credential });
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<{ user: User }> {
    const res: any = await api.get('/auth/me');
    return res.data;
  },
};
