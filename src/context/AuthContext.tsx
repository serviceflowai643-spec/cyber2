import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types.js';
import { api, setAuthToken, ApiError } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string, bio: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user || null);
    } catch (e) {
      setUser(null);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      const res = await api.login({ usernameOrEmail, password });
      setAuthToken(res.token);
      setUser(res.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  const register = async (username: string, email: string, password: string, displayName?: string) => {
    try {
      const res = await api.register({ username, email, password, displayName });
      setAuthToken(res.token);
      setUser(res.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('Logout api call failed:', e);
    } finally {
      setAuthToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (displayName: string, bio: string) => {
    try {
      await api.updateProfile({ displayName, bio });
      if (user) {
        setUser({ ...user, displayName, bio });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Update failed.' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await api.changePassword({ currentPassword, newPassword });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password change failed.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
      }}
    >
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
