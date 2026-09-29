import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { User } from 'firebase/auth';
import { authService } from '@/services/auth/authService';
import { getUserProfile } from '@/services/auth/userProfileService';
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
  refreshEmailVerification: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    isFirebaseConfigured ? 'AUTHENTICATING' : 'UNAUTHENTICATED',
  );
  const authEventRef = useRef(0);

  const refreshProfile = async () => {
    if (!firebaseUser) return;
    const eventId = ++authEventRef.current;
    const next = await getUserProfile(firebaseUser.uid);
    if (eventId !== authEventRef.current) return;
    setProfile(next);
    if (!next) setStatus('PROFILE_INCOMPLETE');
    else if (next.status === 'suspended') setStatus('ACCOUNT_SUSPENDED');
    else if (!next.onboardingCompleted) setStatus('PROFILE_INCOMPLETE');
    else setStatus('AUTHENTICATED');
  };

  const refreshEmailVerification = async () => {
    const eventId = ++authEventRef.current;
    const user = await authService.reloadCurrentUser();
    if (!user) {
      if (eventId !== authEventRef.current) return false;
      setFirebaseUser(null);
      setProfile(null);
      setStatus('UNAUTHENTICATED');
      return false;
    }

    if (eventId !== authEventRef.current) return false;
    setFirebaseUser(user);

    if (!user.emailVerified) {
      setStatus('EMAIL_VERIFICATION_REQUIRED');
      return false;
    }

    const next = await getUserProfile(user.uid);
    if (eventId !== authEventRef.current) return false;
    setProfile(next);

    if (!next) setStatus('PROFILE_INCOMPLETE');
    else if (next.status === 'suspended') setStatus('ACCOUNT_SUSPENDED');
    else if (!next.onboardingCompleted) setStatus('PROFILE_INCOMPLETE');
    else setStatus('AUTHENTICATED');

    return true;
  };

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return authService.subscribe(async (user) => {
      const eventId = ++authEventRef.current;
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
        const next = await getUserProfile(user.uid);
        if (eventId !== authEventRef.current) return;
        setProfile(next);
        if (!next) setStatus('PROFILE_INCOMPLETE');
        else if (next.status === 'suspended') setStatus('ACCOUNT_SUSPENDED');
        else if (!next.onboardingCompleted) setStatus('PROFILE_INCOMPLETE');
        else setStatus('AUTHENTICATED');
      } catch {
        if (eventId === authEventRef.current) setStatus('PROFILE_INCOMPLETE');
      }
    });
  }, []);

  const value = useMemo(
    () => ({ firebaseUser, profile, status, refreshProfile, refreshEmailVerification }),
    [firebaseUser, profile, status],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
