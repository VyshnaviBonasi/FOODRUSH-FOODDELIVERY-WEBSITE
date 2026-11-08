import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../api/client';
import type { User, UserRole } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (userData: Partial<User> & { password?: string }) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole, email?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('foodrush_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const res = await api.auth.me();
          setUser(res.user);
        } catch (err) {
          console.warn('Session expired or invalid, switching to default demo customer');
          await switchRole('customer', 'vyshnavi@foodrush.com');
        }
      } else {
        // Automatically default to demo customer Bonasi Vyshnavi
        await switchRole('customer', 'vyshnavi@foodrush.com');
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      const res = await api.auth.login(email, password);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('foodrush_token', res.token);
      toast(`Welcome back, ${res.user.name}!`, 'success');
    } catch (err: any) {
      toast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const register = async (userData: Partial<User> & { password?: string }) => {
    try {
      const res = await api.auth.register(userData);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('foodrush_token', res.token);
      toast(`Account created! Welcome, ${res.user.name}!`, 'success');
    } catch (err: any) {
      toast(err.message || 'Registration failed', 'error');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('foodrush_token');
    toast('Signed out successfully', 'info');
  };

  const switchRole = async (role: UserRole, email?: string) => {
    try {
      const res = await api.auth.demoSwitch(role, email);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('foodrush_token', res.token);
      toast(`Switched perspective to: ${res.user.name} (${res.user.role.toUpperCase()})`, 'success');
    } catch (err: any) {
      toast('Failed to switch persona: ' + err.message, 'error');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
