import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (token: string) => Promise<User>;
  register: (data: { email: string; password: string; nombres: string; apellidos: string }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      if (profile && profile.id) {
        const normalized = {
          ...profile,
          role: (profile.rol || profile.role || 'CLIENTE').toUpperCase(),
          rol: (profile.rol || profile.role || 'CLIENTE').toUpperCase(),
        };
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
      }
    } catch {
      // No forzar logout si falla una sincronización secundaria de perfil
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    init();
  }, [logout]);

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    const normalizedUser = {
      ...res.user,
      role: (res.user.rol || res.user.role || 'CLIENTE').toUpperCase(),
      rol: (res.user.rol || res.user.role || 'CLIENTE').toUpperCase(),
    };
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setToken(res.token);
    setUser(normalizedUser);
    return normalizedUser;
  };

  const register = async (data: { email: string; password: string; nombres: string; apellidos: string }) => {
    const res = await authService.register(data);
    const normalizedUser = {
      ...res.user,
      role: (res.user.rol || res.user.role || 'CLIENTE').toUpperCase(),
      rol: (res.user.rol || res.user.role || 'CLIENTE').toUpperCase(),
    };
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setToken(res.token);
    setUser(normalizedUser);
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await authService.loginWithGoogle(credential);
    const normalizedUser = {
      ...res.user,
      role: (res.user.rol || res.user.role || 'CLIENTE').toUpperCase(),
      rol: (res.user.rol || res.user.role || 'CLIENTE').toUpperCase(),
    };
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setToken(res.token);
    setUser(normalizedUser);
    return normalizedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        role: user?.role || user?.rol || null,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
