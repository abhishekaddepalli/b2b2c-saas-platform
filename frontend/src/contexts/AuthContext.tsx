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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem('auth_token')) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const response = await authApi.me();
      setUser(response.data.data);
    } catch {
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
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
