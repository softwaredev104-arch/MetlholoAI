import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { getFirestoreDb } from '@/services/firebase/client';
import { AgriculturalProductSchema, CropGuidelineSchema, MarketPriceSchema, type AgriculturalProduct, type CropGuideline, type MarketPrice } from './models';

const db = () => getFirestoreDb();

export async function listPublishedProducts(filters: { category?: string; targetCrop?: string; targetSpecies?: string; disease?: string; targetPest?: string } = {}): Promise<AgriculturalProduct[]> {
  const snapshot = await getDocs(query(collection(db(), 'agriculturalCatalog'), where('publicationStatus', '==', 'published'), limit(100)));
  let items = snapshot.docs.map(d => AgriculturalProductSchema.parse({ id: d.id, ...d.data() }));
  if (filters.category) items = items.filter(x => x.category === filters.category);
  if (filters.targetCrop) items = items.filter(x => x.targetCrop?.toLowerCase() === filters.targetCrop!.toLowerCase());
  if (filters.targetSpecies) items = items.filter(x => x.targetSpecies?.toLowerCase() === filters.targetSpecies!.toLowerCase());
  if (filters.disease) items = items.filter(x => x.disease?.toLowerCase() === filters.disease!.toLowerCase());
  if (filters.targetPest) items = items.filter(x => x.targetPest?.toLowerCase() === filters.targetPest!.toLowerCase());
  return items;
}

export async function listPublishedGuidelines(problem: string, crop?: string): Promise<CropGuideline[]> {
  const snapshot = await getDocs(query(collection(db(), 'cropGuidelines'), where('publicationStatus', '==', 'published'), limit(100)));
  const normalized = problem.trim().toLowerCase();
  return snapshot.docs.map(d => CropGuidelineSchema.parse({ id: d.id, ...d.data() }))
    .filter(x => [x.problem, ...x.relatedProblems].some(p => p.toLowerCase() === normalized || p.toLowerCase().includes(normalized)))
    .filter(x => !crop || !x.crop || x.crop.toLowerCase() === crop.toLowerCase());
}

export async function listPublishedMarketPrices(commodity?: string): Promise<MarketPrice[]> {
  const snapshot = await getDocs(query(collection(db(), 'marketPrices'), where('publicationStatus', '==', 'published'), limit(100)));
  const items = snapshot.docs.map(d => MarketPriceSchema.parse({ id: d.id, ...d.data() }));
  return commodity ? items.filter(x => x.commodity.toLowerCase() === commodity.toLowerCase()) : items;
}
