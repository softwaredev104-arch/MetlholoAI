import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getFirestoreDb } from '@/services/firebase/client';

export type MarketplaceListing = {
  id: string;
  ownerId: string;
  farmId?: string;
  title: string;
  listingType: 'animal' | 'crop' | 'vaccine' | 'fertilizer' | 'agrochemical' | 'feed' | 'other';
  description?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  currency: 'BWP';
  catalogProductId?: string;
  status: 'draft' | 'published' | 'sold' | 'archived';
  createdAt: string;
};

export async function listMyMarketplaceListings(ownerId: string): Promise<MarketplaceListing[]> {
  const snapshot = await getDocs(query(collection(getFirestoreDb(), 'marketplaceListings'), where('ownerId', '==', ownerId)));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MarketplaceListing));
}

export async function createMarketplaceListing(ownerId: string, input: Omit<MarketplaceListing, 'id' | 'ownerId' | 'createdAt'>) {
  const createdAt = new Date().toISOString();
  const ref = await addDoc(collection(getFirestoreDb(), 'marketplaceListings'), { ...input, ownerId, createdAt });
  return { id: ref.id, ...input, ownerId, createdAt };
}
