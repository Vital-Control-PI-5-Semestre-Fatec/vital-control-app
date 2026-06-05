import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { apiRequest } from '../services/api/client';
import { secureStorage } from '../services/storage/secure-storage';
import type { AuthSession, ChangePasswordPayload, LoginPayload, RegisterPayload, UserRole } from '../types/auth';

const SESSION_KEY = 'vital-control.session';

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  enterDemo: (role?: UserRole) => Promise<void>;
  updateUser: (payload: Pick<AuthSession['user'], 'name' | 'email'>) => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(session: AuthSession | null) {
  if (session) {
    await secureStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return;
  }

  await secureStorage.deleteItem(SESSION_KEY);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    secureStorage.getItem(SESSION_KEY)
      .then((storedSession) => {
        if (storedSession) {
          setSession(JSON.parse(storedSession) as AuthSession);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function applySession(nextSession: AuthSession | null) {
    await persistSession(nextSession);
    setSession(nextSession);
  }

  async function logout() {
    await applySession(null);
  }

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('vital-control.session-expired', () => {
      void logout();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  async function login(payload: LoginPayload) {
    const nextSession = await apiRequest<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await applySession(nextSession);
  }

  async function register(payload: RegisterPayload) {
    const nextSession = await apiRequest<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await applySession(nextSession);
  }

  async function enterDemo(role: UserRole = 'PATIENT') {
    const demoUser = {
      PATIENT: { id: 'demo-patient', name: 'Beatriz Lima', email: 'beatriz@example.com' },
      CAREGIVER: { id: 'demo-caregiver', name: 'Cuidador Demo', email: 'cuidador@example.com' },
      CARE_MANAGER: { id: 'demo-manager', name: 'Gerente Demo', email: 'gerente@example.com' },
      RESPONSIBLE: { id: 'demo-responsible', name: 'Responsável Demo', email: 'responsavel@example.com' },
    }[role];

    await applySession({
      accessToken: 'demo-token',
      user: {
        ...demoUser,
        role,
      },
    });
  }

  async function updateUser(payload: Pick<AuthSession['user'], 'name' | 'email'>) {
    if (!session) return;
    await applySession({ ...session, user: { ...session.user, ...payload } });
  }

  async function changePassword(payload: ChangePasswordPayload) {
    if (!session) return;
    if (session.accessToken === 'demo-token') return;

    await apiRequest<void>(
      '/auth/change-password',
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      session.accessToken,
    );
  }

  const value = useMemo(
    () => ({ session, isLoading, login, register, enterDemo, updateUser, changePassword, logout }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
