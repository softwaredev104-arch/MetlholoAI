import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService, type AuthUser } from '@/services/auth/authService';
import {
  createInitialUserProfile,
  getUserProfile,
} from '@/services/auth/userProfileService';
import { isAuthConfigured } from '@/config/env';
import type { UserProfile } from '@/types/user';

export type AuthStatus =
  | 'AUTHENTICATING'
  | 'UNAUTHENTICATED'
  | 'AUTHENTICATED'
  | 'PROFILE_INCOMPLETE'
  | 'ACCOUNT_SUSPENDED'
  | 'CONFIGURATION_REQUIRED';

type AuthContextValue = {
  user: AuthUser | null;
  profile: UserProfile | null;
  status: AuthStatus;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    isAuthConfigured ? 'AUTHENTICATING' : 'CONFIGURATION_REQUIRED',
  );

  const applyProfile = (next: UserProfile | null) => {
    setProfile(next);
    if (!next || !next.onboardingCompleted) setStatus('PROFILE_INCOMPLETE');
    else if (next.status === 'suspended') setStatus('ACCOUNT_SUSPENDED');
    else setStatus('AUTHENTICATED');
  };

  const refreshProfile = async () => {
    if (!user) return;
    let next = await getUserProfile(user);
    if (!next) next = await createInitialUserProfile(user);
    applyProfile(next);
  };

  const refreshSession = async () => {
    if (!isAuthConfigured) {
      setUser(null);
      setProfile(null);
      setStatus('CONFIGURATION_REQUIRED');
      return;
    }

    setStatus('AUTHENTICATING');
    try {
      const nextUser = await authService.getSession();
      setUser(nextUser);
      setProfile(null);

      if (!nextUser) {
        setStatus('UNAUTHENTICATED');
        return;
      }

      let nextProfile = await getUserProfile(nextUser);
      if (!nextProfile) nextProfile = await createInitialUserProfile(nextUser);
      applyProfile(nextProfile);
    } catch {
      setUser(null);
      setProfile(null);
      setStatus('UNAUTHENTICATED');
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const value = useMemo(
    () => ({ user, profile, status, refreshSession, refreshProfile }),
    [user, profile, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
