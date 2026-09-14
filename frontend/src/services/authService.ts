import api from './api';
import { User } from '../types';

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },

  async register(fullName: string, email: string, password: string, role: string = 'USER'): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', { fullName, email, password, role });
    return res.data;
  },

  async getProfile(): Promise<User> {
    const res = await api.get<User>('/auth/profile');
    return res.data;
  },
};
