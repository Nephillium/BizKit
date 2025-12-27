import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe, setAuthToken } from '../lib/api';

interface User {
  id: number;
  email: string;
  role: string;
  credits: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        setAuthToken(token);
        const response = await getMe();
        if (response.success && response.user) {
          setUser(response.user);
        } else {
          await SecureStore.deleteItemAsync('auth_token');
          setAuthToken(null);
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await apiLogin(email, password);
    if (response.success && response.user && response.token) {
      await SecureStore.setItemAsync('auth_token', response.token);
      setUser(response.user);
      return { success: true };
    }
    return { success: false, error: response.error || 'Login failed' };
  }

  async function register(email: string, password: string) {
    const response = await apiRegister(email, password);
    if (response.success && response.user && response.token) {
      await SecureStore.setItemAsync('auth_token', response.token);
      setUser(response.user);
      return { success: true };
    }
    return { success: false, error: response.error || 'Registration failed' };
  }

  async function logout() {
    await apiLogout();
    await SecureStore.deleteItemAsync('auth_token');
    setUser(null);
  }

  async function refreshUser() {
    const response = await getMe();
    if (response.success && response.user) {
      setUser(response.user);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
