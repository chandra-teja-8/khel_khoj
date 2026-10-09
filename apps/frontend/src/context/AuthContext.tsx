'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export interface UserProfile {
  id: string;
  fullName: string;
  gender: string;
  state: string;
  district: string;
  dateOfBirth: string;
  heightCm?: number;
  weightKg?: number;
  primarySport?: { id: string; name: string };
}

export interface User {
  id: string;
  email: string;
  role: 'ATHLETE' | 'SAI_ADMIN';
  profile?: UserProfile;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  quickLogin: (role: 'ATHLETE' | 'SAI_ADMIN') => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  quickLogin: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('khelkhoj_token');
    if (savedToken) {
      setToken(savedToken);
      apiFetch('/auth/me')
        .then((userData) => setUser(userData))
        .catch(() => {
          localStorage.removeItem('khelkhoj_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass })
    });
    localStorage.setItem('khelkhoj_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('khelkhoj_token');
    setToken(null);
    setUser(null);
  };

  const quickLogin = async (role: 'ATHLETE' | 'SAI_ADMIN') => {
    if (role === 'SAI_ADMIN') {
      await login('admin@sai.gov.in', 'SaiAdmin@2026');
    } else {
      await login('rahul.verma@example.com', 'Athlete@2026');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, quickLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
