import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: () => boolean;
  isReseller: () => boolean;
  isCustomer: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem('user'));

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('auth_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const response = await authApi.me();
      if (response.data?.data) {
        setUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string, remember = false) => {
    const response = await authApi.login({ email, password, remember });
    const { token: newToken, data } = response.data;
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(data);
    return data as AuthUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Proceed regardless
    } finally {
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    }
  }, []);

  const hasRole = useCallback((role: string) => user?.roles.includes(role) ?? false, [user]);
  const hasPermission = useCallback((perm: string) => user?.permissions.includes(perm) ?? false, [user]);
  const isSuperAdmin = useCallback(() => hasRole('SUPER_ADMIN'), [hasRole]);
  const isReseller = useCallback(() => hasRole('RESELLER'), [hasRole]);
  const isCustomer = useCallback(() => hasRole('USER'), [hasRole]);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user,
      login, logout, refreshUser,
      hasRole, hasPermission,
      isSuperAdmin, isReseller, isCustomer,
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
