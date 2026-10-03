import AsyncStorage from '@react-native-async-storage/async-storage';
import { driveJsonStore } from '@/services/drive/driveJsonStore';

export type MarketplaceListing = {
  id: string;
  ownerId: string;
  farmId?: string;
  title: string;
  listingType:
    | 'animal'
    | 'crop'
    | 'vaccine'
    | 'fertilizer'
    | 'agrochemical'
    | 'feed'
    | 'other';
  description?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  currency: 'BWP';
  catalogProductId?: string;
  status: 'draft' | 'published' | 'sold' | 'archived';
  createdAt: string;
};

const key = (ownerId: string) => 'metlholoai.marketplace.' + ownerId;

async function read(ownerId: string): Promise<MarketplaceListing[]> {
  const raw = await AsyncStorage.getItem(key(ownerId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as MarketplaceListing[];
  } catch {
    return [];
  }
}

async function persist(ownerId: string, items: MarketplaceListing[]) {
  await AsyncStorage.setItem(key(ownerId), JSON.stringify(items));
  if (driveJsonStore.isConnected()) {
    await driveJsonStore.writeJson('marketplace.json', {
      ownerId,
      listings: items,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function listMyMarketplaceListings(
  ownerId: string,
): Promise<MarketplaceListing[]> {
  return read(ownerId);
}

export async function createMarketplaceListing(
  ownerId: string,
  input: Omit<MarketplaceListing, 'id' | 'ownerId' | 'createdAt'>,
) {
  const current = await read(ownerId);
  const listing: MarketplaceListing = {
    ...input,
    id:
      'listing_' +
      Date.now() +
      '_' +
      Math.random().toString(36).slice(2, 8),
    ownerId,
    createdAt: new Date().toISOString(),
  };
  await persist(ownerId, [listing, ...current]);
  return listing;
}
