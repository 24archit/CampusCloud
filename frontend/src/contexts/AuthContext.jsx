import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cc_token'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const setAuthToken = (newToken) => {
    if (newToken) {
      localStorage.setItem('cc_token', newToken);
    } else {
      localStorage.removeItem('cc_token');
    }
    setToken(newToken);
  };

  const refreshUser = useCallback(async () => {
    const stored = localStorage.getItem('cc_token');
    if (!stored) {
      setLoading(false);
      return;
    }
    try {
      const res = await authAPI.getProfile();
      setUser(res.data.user || res.data);
    } catch (err) {
      console.error('Token validation failed:', err);
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: newToken, user: userData } = res.data;
    setAuthToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    const { token: newToken, user: userData } = res.data;
    setAuthToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isAdmin,
      loading,
      login,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
