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
import { restoreWorkspaceFromDrive } from '@/services/drive/workspaceRecoveryService';
import { listFarms } from '@/services/farms/farmRepository';
import { isFirebaseConfigured } from '@/config/env';
import type { UserProfile } from '@/types/user';

export type AuthStatus =
  | 'AUTHENTICATING'
  | 'UNAUTHENTICATED'
  | 'AUTHENTICATED'
  | 'EMAIL_VERIFICATION_REQUIRED'
  | 'PROFILE_INCOMPLETE'
  | 'DATA_RECOVERY_REQUIRED'
  | 'ACCOUNT_SUSPENDED';

type AuthContextValue = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  status: AuthStatus;
  refreshProfile: () => Promise<void>;
  recoverFromDrive: () => Promise<boolean>;
  continueWithoutDriveBackup: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isGoogleUser(user: User) {
  return user.providerData.some(provider => provider.providerId === 'google.com');
}

function isReturningUser(user: User) {
  const created = Date.parse(user.metadata.creationTime ?? '');
  const lastSignIn = Date.parse(user.metadata.lastSignInTime ?? '');

  if (!Number.isFinite(created) || !Number.isFinite(lastSignIn)) {
    return false;
  }

  return lastSignIn - created > 60_000;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    isFirebaseConfigured ? 'AUTHENTICATING' : 'UNAUTHENTICATED',
  );

  const applyProfile = (next: UserProfile) => {
    setProfile(next);

    if (next.status === 'suspended') {
      setStatus('ACCOUNT_SUSPENDED');
    } else if (!next.onboardingCompleted) {
      setStatus('PROFILE_INCOMPLETE');
    } else {
      setStatus('AUTHENTICATED');
    }
  };

  const bootstrapUser = async (user: User) => {
    const googleUser = isGoogleUser(user);
    const rememberedGrant = await driveAuthService.hasRememberedGrant(user.uid);

    if (!driveAuthService.isConnected()) {
      await driveAuthService.restore({
        ownerId: user.uid,
        expectedEmail: googleUser ? user.email : undefined,
        force: googleUser || rememberedGrant,
      });
    }

    // Always reconcile verified Drive data when a fresh token is available:
    // even a complete local profile can contain an outdated set of farm records.
    // The recovery service merges by record ID, preserving unsynced local work.
    if (driveAuthService.isConnected()) {
      await restoreWorkspaceFromDrive(user.uid);
    }

    const restoredOrLocal = await getUserProfile(user.uid);
    if (restoredOrLocal) {
      const existingFarms = await listFarms(user.uid);
      // A prior completed profile without its farms must not be treated as a
      // newly empty farm workspace. Ask for recovery before allowing writes.
      if (restoredOrLocal.onboardingCompleted && existingFarms.length === 0) {
        return null;
      }
      if (!restoredOrLocal.onboardingCompleted && rememberedGrant &&
          !driveAuthService.isConnected() && isReturningUser(user)) {
        return null;
      }
      return restoredOrLocal;
    }

    if (isReturningUser(user)) {
      return null;
    }

    return createInitialUserProfile({
      uid: user.uid,
      displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Farmer',
      email: user.email ?? '',
      photoURL: user.photoURL,
      role: 'FARMER',
    });
  };

  const refreshProfile = async () => {
    if (!firebaseUser) return;

    setStatus('AUTHENTICATING');
    try {
      const next = await bootstrapUser(firebaseUser);
      if (!next) {
        setProfile(null);
        setStatus('DATA_RECOVERY_REQUIRED');
        return;
      }
      applyProfile(next);
    } catch {
      const local = await getUserProfile(firebaseUser.uid);
      if (local) {
        applyProfile(local);
      } else {
        setProfile(null);
        setStatus('DATA_RECOVERY_REQUIRED');
      }
    }
  };

  const recoverFromDrive = async () => {
    if (!firebaseUser) return false;

    setStatus('AUTHENTICATING');

    try {
      const googleUser = isGoogleUser(firebaseUser);

      await driveAuthService.connect({
        ownerId: firebaseUser.uid,
        expectedEmail: googleUser ? firebaseUser.email : undefined,
        prompt: 'select_account',
      });

      const recovered = await restoreWorkspaceFromDrive(firebaseUser.uid);
      const next = recovered.profile ?? (await getUserProfile(firebaseUser.uid));

      if (!recovered.restored || !next) {
        setProfile(null);
        setStatus('DATA_RECOVERY_REQUIRED');
        return false;
      }

      applyProfile(next);
      return true;
    } catch {
      setProfile(null);
      setStatus('DATA_RECOVERY_REQUIRED');
      return false;
    }
  };

  const continueWithoutDriveBackup = async () => {
    if (!firebaseUser) throw new Error('Please sign in first.');
    const existing = await getUserProfile(firebaseUser.uid);
    if (existing) {
      applyProfile(existing);
      return;
    }
    const next = await createInitialUserProfile({
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Farmer',
      email: firebaseUser.email ?? '',
      photoURL: firebaseUser.photoURL,
      role: 'FARMER',
    });
    applyProfile(next);
  };

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let active = true;
    let sequence = 0;

    const unsubscribe = authService.subscribe(async user => {
      const currentSequence = ++sequence;
      if (!active) return;
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

      setStatus('AUTHENTICATING');

      try {
        const next = await bootstrapUser(user);
        if (!active || currentSequence !== sequence) return;

        if (!next) {
          setStatus('DATA_RECOVERY_REQUIRED');
          return;
        }

        applyProfile(next);
      } catch {
        const local = await getUserProfile(user.uid);
        if (!active || currentSequence !== sequence) return;
        if (local) {
          applyProfile(local);
        } else {
          setStatus('DATA_RECOVERY_REQUIRED');
        }
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
      firebaseUser,
      profile,
      status,
      refreshProfile,
      recoverFromDrive,
      continueWithoutDriveBackup,
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
