export const ROLES=['FARMER','FARM_MANAGER','AGRICULTURAL_PROFESSIONAL','VETERINARIAN','AGRONOMIST','RESEARCHER','BUSINESS','ADMIN'] as const;
export type Role=(typeof ROLES)[number];
export const SUBSCRIPTION_TIERS=['FREE','PREMIUM','PRO','BUSINESS'] as const;
export type SubscriptionTier=(typeof SUBSCRIPTION_TIERS)[number];
export type AccountStatus='active'|'suspended';

export interface UserProfile {
  uid:string;
  displayName:string;
  email:string;
  photoURL?:string|null;
  role:Role;
  subscriptionTier:SubscriptionTier;
  status:AccountStatus;
  onboardingCompleted:boolean;
  onboardingStep?:number;
  location?: { latitude:number; longitude:number; label?:string };
  farmId?:string;
  farmTypes?:string[];
  animalCategories?:string[];
  cropCategories?:string[];
  notificationPreferences?: { push:boolean; alerts:boolean; diagnosis:boolean; tasks:boolean; marketplace:boolean };
  termsAcceptedAt?:unknown;
  privacyAcceptedAt?:unknown;
  subscribedAt?:unknown;
  subscriptionProvider?:'paypal'|'test';
  createdAt?:unknown;
  updatedAt?:unknown;
}