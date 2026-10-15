import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User } from 'firebase/auth';
import { authService } from '@/services/auth/authService';
import {
  createInitialUserProfile,
  getUserProfile,
} from '@/services/auth/userProfileService';
import { driveAuthService } from '@/services/drive/driveAuthService';
import { isFirebaseConfigured } from '@/config/env';
import type { UserProfile } from '@/types/user';

export type AuthStatus =
  | 'AUTHENTICATING'
  | 'UNAUTHENTICATED'
  | 'AUTHENTICATED'
  | 'EMAIL_VERIFICATION_REQUIRED'
  | 'PROFILE_INCOMPLETE'
  | 'RECOVERY_REQUIRED'
  | 'ACCOUNT_SUSPENDED';

type AuthContextValue = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  status: AuthStatus;
  refreshProfile: () => Promise<void>;
  startNewProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function classifyProfile(next: UserProfile): AuthStatus {
  if (next.status === 'suspended') return 'ACCOUNT_SUSPENDED';
  if (!next.onboardingCompleted) return 'PROFILE_INCOMPLETE';
  return 'AUTHENTICATED';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    isFirebaseConfigured ? 'AUTHENTICATING' : 'UNAUTHENTICATED',
  );

  const applyProfile = (next: UserProfile | null) => {
    setProfile(next);
    // An existing Firebase identity with no local profile may have a Drive
    // backup. Do not silently create a new farmer and lose the old workspace.
    setStatus(next ? classifyProfile(next) : 'RECOVERY_REQUIRED');
  };

  const refreshProfile = async () => {
    const user = authService.currentUser();
    if (!user) return;
    applyProfile(await getUserProfile(user.uid));
  };

  const startNewProfile = async () => {
    const user = authService.currentUser();
    if (!user) throw new Error('Please sign in to continue.');
    const existing = await getUserProfile(user.uid);
    const next = existing ?? await createInitialUserProfile({
      uid: user.uid,
      displayName: user.displayName?.trim() || user.email?.split('@')[0] || 'Farmer',
      email: user.email ?? '',
      photoURL: user.photoURL,
      role: 'FARMER',
    });
    applyProfile(next);
  };

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let active = true;
    let sequence = 0;
    const unsubscribe = authService.subscribe(async user => {
      const cycle = ++sequence;
      if (!active) return;
      setFirebaseUser(user);
      setProfile(null);
      if (!user) {
        driveAuthService.clearSession();
        setStatus('UNAUTHENTICATED');
        return;
      }
      setStatus('AUTHENTICATING');
      if (!user.emailVerified) {
        setStatus('EMAIL_VERIFICATION_REQUIRED');
        return;
      }
      try {
        const current = await getUserProfile(user.uid);
        if (active && cycle === sequence) applyProfile(current);
      } catch {
        if (active && cycle === sequence) applyProfile(null);
      }
    });
    return () => {
      active = false;
      ++sequence;
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      firebaseUser, profile, status, refreshProfile, startNewProfile,
    }),
    [firebaseUser, profile, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
