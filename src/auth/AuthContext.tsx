import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, ApiError, AuthResponse, setAuthToken, setUnauthorizedHandler, User } from '@/api';
import { clearSession, loadSession, saveSession } from './sessionStorage';

interface Session {
  token: string;
  user: User;
}

interface AuthState {
  /** true mientras se recupera la sesión guardada al abrir la app. */
  loading: boolean;
  user: User | null;
  signIn: (auth: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await clearSession();
  }, []);

  const signIn = useCallback(async (auth: AuthResponse) => {
    const session: Session = { token: auth.access_token, user: auth.user };
    setAuthToken(session.token);
    setUser(session.user);
    await saveSession(JSON.stringify(session));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => void signOut());

    (async () => {
      const raw = await loadSession();
      const session: Session | null = raw ? safeParse(raw) : null;
      if (session) {
        // Se entra de inmediato con la sesión guardada y se valida contra la API en segundo plano
        // (el servidor gratuito puede tardar en despertar).
        setAuthToken(session.token);
        setUser(session.user);
        api.auth.me().then(setUser, (e) => {
          if (e instanceof ApiError && e.status === 401) void signOut();
        });
      }
      setLoading(false);
    })();

    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const value = useMemo(() => ({ loading, user, signIn, signOut }), [loading, user, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

function safeParse(raw: string): Session | null {
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}
