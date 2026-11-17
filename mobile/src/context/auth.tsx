import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, loadToken, setToken } from '@/api/client';
import type { Role, Store, User } from '@/api/types';
import { queryClient } from '@/api/queryClient';

type AuthState = {
  user: User | null;
  store: Store | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; phone?: string; role: Role }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    setStore(data.store);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (await loadToken()) await refresh();
      } catch {
        await setToken(null);
      } finally {
        setReady(true);
      }
    })();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post('/auth/login', { email: email.trim(), password });
      await setToken(data.token);
      setUser(data.user);
      await refresh().catch(() => {});
      return data.user as User;
    },
    [refresh],
  );

  const register = useCallback(async (body: { name: string; email: string; password: string; phone?: string; role: Role }) => {
    const { data } = await api.post('/auth/register', { ...body, email: body.email.trim() });
    await setToken(data.token);
    setUser(data.user);
    setStore(null);
    return data.user as User;
  }, []);

  const logout = useCallback(async () => {
    await setToken(null);
    setUser(null);
    setStore(null);
    queryClient.clear();
  }, []);

  const value = useMemo(() => ({ user, store, ready, login, register, logout, refresh, setUser }), [user, store, ready, login, register, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** Route group for each role. */
export function homeFor(role?: Role) {
  if (role === 'store') return '/store/dashboard' as const;
  if (role === 'volunteer') return '/volunteer/tasks' as const;
  return '/buyer/home' as const;
}
