import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { adminApi, authApi } from '../api';
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
  // Impersonation state & methods
  impersonator: AuthUser | null;
  isImpersonating: boolean;
  impersonateUser: (userId: string) => Promise<string>;
  impersonateOrg: (orgId: string) => Promise<string>;
  stopImpersonating: () => Promise<void>;
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

  // Impersonator backup state
  const [impersonator, setImpersonator] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('impersonator_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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
      // Keep session alive if cached user exists; do not bounce to login
      if (err?.response?.status === 401 && !localStorage.getItem('user')) {
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
      localStorage.removeItem('user');
      localStorage.removeItem('impersonator_token');
      localStorage.removeItem('impersonator_user');
      setToken(null);
      setUser(null);
      setImpersonator(null);
    }
  }, []);

  // Impersonation handlers
  const impersonateUser = useCallback(async (userId: string): Promise<string> => {
    const currentToken = localStorage.getItem('auth_token');
    const currentUser = localStorage.getItem('user');

    const res = await adminApi.impersonateUser(userId);
    const { token: newToken, data: targetUser, target_route } = res.data;

    if (currentToken && currentUser) {
      localStorage.setItem('impersonator_token', currentToken);
      localStorage.setItem('impersonator_user', currentUser);
      try {
        setImpersonator(JSON.parse(currentUser));
      } catch {}
    }

    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user', JSON.stringify(targetUser));
    setToken(newToken);
    setUser(targetUser);

    return target_route || '/';
  }, []);

  const impersonateOrg = useCallback(async (orgId: string): Promise<string> => {
    const currentToken = localStorage.getItem('auth_token');
    const currentUser = localStorage.getItem('user');

    const res = await adminApi.impersonateOrg(orgId);
    const { token: newToken, data: targetUser, target_route } = res.data;

    if (currentToken && currentUser) {
      localStorage.setItem('impersonator_token', currentToken);
      localStorage.setItem('impersonator_user', currentUser);
      try {
        setImpersonator(JSON.parse(currentUser));
      } catch {}
    }

    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user', JSON.stringify(targetUser));
    setToken(newToken);
    setUser(targetUser);

    return target_route || '/';
  }, []);

  const stopImpersonating = useCallback(async (): Promise<void> => {
    try {
      await adminApi.stopImpersonate();
    } catch {}

    const originalToken = localStorage.getItem('impersonator_token');
    const originalUser = localStorage.getItem('impersonator_user');

    localStorage.removeItem('impersonator_token');
    localStorage.removeItem('impersonator_user');
    setImpersonator(null);

    if (originalToken && originalUser) {
      localStorage.setItem('auth_token', originalToken);
      localStorage.setItem('user', originalUser);
      setToken(originalToken);
      try {
        setUser(JSON.parse(originalUser));
      } catch {}
    } else {
      await logout();
    }
  }, [logout]);

  const hasRole = useCallback((role: string) => {
    if (!user?.roles) return false;
    // Super Admin has universal authorization across Admin, Reseller, and Customer panels
    if (user.roles.includes('SUPER_ADMIN')) return true;
    return user.roles.includes(role);
  }, [user]);

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
      impersonator,
      isImpersonating: !!impersonator,
      impersonateUser,
      impersonateOrg,
      stopImpersonating,
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
