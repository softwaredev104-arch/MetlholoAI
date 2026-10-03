export const ROLES = [
  'FARMER',
  'FARM_MANAGER',
  'AGRICULTURAL_PROFESSIONAL',
  'VETERINARIAN',
  'AGRONOMIST',
  'RESEARCHER',
  'BUSINESS',
  'ADMIN',
] as const;

export type Role = (typeof ROLES)[number];

export const SUBSCRIPTION_TIERS = ['FREE', 'PREMIUM', 'PRO', 'BUSINESS'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export type AccountStatus = 'active' | 'suspended';
export type PrimaryActivity = 'CROPS' | 'LIVESTOCK' | 'MIXED' | 'AGRIBUSINESS' | 'PROFESSIONAL';
export type FarmType = 'CROPS' | 'LIVESTOCK' | 'MIXED';
export type FarmSizeBand = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  role: Role;
  subscriptionTier: SubscriptionTier;
  status: AccountStatus;
  onboardingCompleted: boolean;
  primaryActivity?: PrimaryActivity;
  farmName?: string;
  farmType?: FarmType;
  locationLabel?: string;
  farmSizeBand?: FarmSizeBand;
  alertPreferences?: {
    outbreaks: boolean;
    weather: boolean;
    market: boolean;
  };
  createdAt?: unknown;
  updatedAt?: unknown;
}
