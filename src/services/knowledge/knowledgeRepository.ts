import type {
  AgriculturalProduct,
  CropGuideline,
  MarketPrice,
} from './models';

const MARKET_PRICES: MarketPrice[] = [
  {
    id: 'maize-market-reference',
    commodity: 'Maize',
    perMtPrice: 4200,
    currency: 'BWP',
    priceType: 'other',
    country: 'Botswana',
    publicationStatus: 'published',
    source: {
      source: 'MetlholoAI design reference',
      country: 'Botswana',
      confidence: 'low',
    },
  },
  {
    id: 'cattle-market-reference',
    commodity: 'Cattle',
    perBagPrice: 8500,
    currency: 'BWP',
    priceType: 'other',
    country: 'Botswana',
    publicationStatus: 'published',
    source: {
      source: 'MetlholoAI design reference',
      country: 'Botswana',
      confidence: 'low',
    },
  },
];

const PRODUCTS: AgriculturalProduct[] = [];
const GUIDELINES: CropGuideline[] = [];

export async function listPublishedProducts(filters: {
  category?: string;
  targetCrop?: string;
  targetSpecies?: string;
  disease?: string;
  targetPest?: string;
} = {}): Promise<AgriculturalProduct[]> {
  return PRODUCTS.filter(item => {
    if (filters.category && item.category !== filters.category) return false;
    if (
      filters.targetCrop &&
      item.targetCrop?.toLowerCase() !== filters.targetCrop.toLowerCase()
    ) return false;
    if (
      filters.targetSpecies &&
      item.targetSpecies?.toLowerCase() !== filters.targetSpecies.toLowerCase()
    ) return false;
    if (
      filters.disease &&
      item.disease?.toLowerCase() !== filters.disease.toLowerCase()
    ) return false;
    if (
      filters.targetPest &&
      item.targetPest?.toLowerCase() !== filters.targetPest.toLowerCase()
    ) return false;
    return true;
  });
}

export async function listPublishedGuidelines(
  problem: string,
  crop?: string,
): Promise<CropGuideline[]> {
  const normalized = problem.trim().toLowerCase();
  return GUIDELINES.filter(item =>
    [item.problem, ...item.relatedProblems].some(value =>
      value.toLowerCase().includes(normalized),
    ),
  ).filter(
    item => !crop || !item.crop || item.crop.toLowerCase() === crop.toLowerCase(),
  );
}

export async function listPublishedMarketPrices(
  commodity?: string,
): Promise<MarketPrice[]> {
  return commodity
    ? MARKET_PRICES.filter(
        item => item.commodity.toLowerCase() === commodity.toLowerCase(),
      )
    : MARKET_PRICES;
}
