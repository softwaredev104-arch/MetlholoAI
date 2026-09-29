import { z } from 'zod';

export const KnowledgeCategorySchema = z.enum(['fertilizer','agrochemical','animal_feed','veterinary','vaccine','seed','other']);
export type KnowledgeCategory = z.infer<typeof KnowledgeCategorySchema>;
export const PublicationStatusSchema = z.enum(['draft','validated','published','archived']);
export type PublicationStatus = z.infer<typeof PublicationStatusSchema>;
export const SourceConfidenceSchema = z.enum(['high','medium','low','unknown']);
export type SourceConfidence = z.infer<typeof SourceConfidenceSchema>;

export const KnowledgeSourceSchema = z.object({
  source: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  sourceDocument: z.string().optional(),
  country: z.string().default('Botswana'),
  extractionMethod: z.enum(['native','ocr','manual','api']).optional(),
  confidence: SourceConfidenceSchema.default('unknown'),
  observedAt: z.string().optional(),
  verifiedAt: z.string().optional(),
});
export type KnowledgeSource = z.infer<typeof KnowledgeSourceSchema>;

export const AgriculturalProductSchema = z.object({
  id: z.string().min(1),
  category: KnowledgeCategorySchema,
  subcategory: z.string().optional(),
  productName: z.string().min(1),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  activeIngredient: z.string().optional(),
  formulation: z.string().optional(),
  targetCrop: z.string().optional(),
  targetPest: z.string().optional(),
  targetSpecies: z.string().optional(),
  disease: z.string().optional(),
  purpose: z.string().optional(),
  packSize: z.number().optional(),
  packUnit: z.string().optional(),
  description: z.string().optional(),
  availability: z.string().optional(),
  publicationStatus: PublicationStatusSchema.default('draft'),
  source: KnowledgeSourceSchema,
});
export type AgriculturalProduct = z.infer<typeof AgriculturalProductSchema>;

export const MarketPriceSchema = z.object({
  id: z.string().min(1),
  commodity: z.string().min(1),
  grade: z.number().optional(),
  perBagPrice: z.number().optional(),
  perMtPrice: z.number().optional(),
  currency: z.string().default('BWP'),
  priceType: z.enum(['producer_price','contract_price','other']),
  country: z.string().default('Botswana'),
  source: KnowledgeSourceSchema,
  publicationStatus: PublicationStatusSchema.default('draft'),
});
export type MarketPrice = z.infer<typeof MarketPriceSchema>;

export const GuidelineRecommendationSchema = z.object({
  productName: z.string().optional(),
  activeIngredient: z.string().optional(),
  formulation: z.string().optional(),
  rate: z.string().optional(),
  instructions: z.string().optional(),
  alternatives: z.array(z.string()).default([]),
});
export type GuidelineRecommendation = z.infer<typeof GuidelineRecommendationSchema>;

export const CropGuidelineSchema = z.object({
  id: z.string().min(1),
  crop: z.string().optional(),
  problem: z.string().min(1),
  relatedProblems: z.array(z.string()).default([]),
  recommendations: z.array(GuidelineRecommendationSchema).default([]),
  source: KnowledgeSourceSchema,
  publicationStatus: PublicationStatusSchema.default('draft'),
});
export type CropGuideline = z.infer<typeof CropGuidelineSchema>;

export const DiagnosisReferenceSchema = z.object({
  prediction: z.string().min(1),
  confidence: z.number().min(0).max(1),
  crop: z.string().optional(),
  livestock: z.string().optional(),
  guidelines: z.array(CropGuidelineSchema).default([]),
  inputs: z.array(AgriculturalProductSchema).default([]),
});
export type DiagnosisReference = z.infer<typeof DiagnosisReferenceSchema>;
