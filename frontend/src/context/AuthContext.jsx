import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('researchlens_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('researchlens_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const data = await api.get('/auth/me');
          if (data?.user) {
            setUser(data.user);
            localStorage.setItem('researchlens_user', JSON.stringify(data.user));
          }
        } catch {
          // Token invalid
          setUser(null);
          setToken(null);
          localStorage.removeItem('researchlens_token');
          localStorage.removeItem('researchlens_user');
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    if (data?.token && data?.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('researchlens_token', data.token);
      localStorage.setItem('researchlens_user', JSON.stringify(data.user));
    }
    return data;
  };

  const register = async (name, email, password) => {
    const data = await api.post('/auth/register', { name, email, password });
    if (data?.token && data?.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('researchlens_token', data.token);
      localStorage.setItem('researchlens_user', JSON.stringify(data.user));
    }
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {}
    setUser(null);
    setToken(null);
    localStorage.removeItem('researchlens_token');
    localStorage.removeItem('researchlens_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
