import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { authService } from '@/services/auth/authService';
import { createInitialUserProfile, getUserProfile } from '@/services/auth/userProfileService';
import { isFirebaseConfigured } from '@/config/env';
import type { UserProfile } from '@/types/user';

export type AuthStatus =
  | 'AUTHENTICATING'
  | 'UNAUTHENTICATED'
  | 'AUTHENTICATED'
  | 'EMAIL_VERIFICATION_REQUIRED'
  | 'PROFILE_INCOMPLETE'
  | 'ACCOUNT_SUSPENDED';

type AuthContextValue = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  status: AuthStatus;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureLocalProfile(user: User) {
  const existing = await getUserProfile(user.uid);
  if (existing) return existing;
  return createInitialUserProfile({
    uid: user.uid,
    displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Farmer',
    email: user.email ?? '',
    photoURL: user.photoURL,
    role: 'FARMER',
  });
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    isFirebaseConfigured ? 'AUTHENTICATING' : 'UNAUTHENTICATED',
  );

  const applyProfile = (next: UserProfile) => {
    setProfile(next);
    if (next.status === 'suspended') setStatus('ACCOUNT_SUSPENDED');
    else if (!next.onboardingCompleted) setStatus('PROFILE_INCOMPLETE');
    else setStatus('AUTHENTICATED');
  };

  const refreshProfile = async () => {
    if (!firebaseUser) return;
    applyProfile(await ensureLocalProfile(firebaseUser));
  };

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return authService.subscribe(async user => {
      setFirebaseUser(user);
      setProfile(null);
      if (!user) {
        setStatus('UNAUTHENTICATED');
        return;
      }
      if (!user.emailVerified) {
        setStatus('EMAIL_VERIFICATION_REQUIRED');
        return;
      }
      try {
        applyProfile(await ensureLocalProfile(user));
      } catch {
        setStatus('PROFILE_INCOMPLETE');
      }
    });
  }, []);

  const value = useMemo(
    () => ({ firebaseUser, profile, status, refreshProfile }),
    [firebaseUser, profile, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
