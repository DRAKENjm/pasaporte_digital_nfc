import api from "./api";
import { User } from "../types";

export interface BackendApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthPayload> {
    const res = await api.post<BackendApiResponse<AuthPayload>>("/auth/login", {
      email,
      password,
    });
    // El backend responde { success: true, message: '...', data: { token, user } }
    if (res.data && res.data.data) {
      return res.data.data;
    }
    return res.data as unknown as AuthPayload;
  },

  async register(data: {
    email: string;
    password: string;
    nombres: string;
    apellidos: string;
  }): Promise<AuthPayload> {
    const res = await api.post<BackendApiResponse<AuthPayload>>(
      "/auth/register",
      data,
    );
    if (res.data && res.data.data) {
      return res.data.data;
    }
    return res.data as unknown as AuthPayload;
  },

  async loginWithGoogle(credential: string): Promise<AuthPayload> {
    const res = await api.post<BackendApiResponse<AuthPayload>>(
      "/auth/google",
      {
        credential,
      },
    );
    if (res.data && res.data.data) {
      return res.data.data;
    }
    return res.data as unknown as AuthPayload;
  },

  async getProfile(): Promise<User> {
    const res = await api.get<BackendApiResponse<User>>("/auth/profile");
    if (res.data && res.data.data) {
      return res.data.data;
    }
    return res.data as unknown as User;
  },
};
