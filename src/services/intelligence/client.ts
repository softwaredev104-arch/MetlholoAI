import { z } from 'zod';
import type { IntelligenceModel } from './catalog';
import { INTELLIGENCE_SERVICES } from './catalog';

export type PredictionResult = {
  success?: boolean;
  prediction?: string;
  disease?: string;
  class?: string;
  label?: string;
  confidence: number;
  [key: string]: unknown;
};

const PredictionResponseSchema = z.object({
  success: z.boolean().optional(),
  prediction: z.string().optional(),
  disease: z.string().optional(),
  class: z.string().optional(),
  label: z.string().optional(),
  confidence: z.union([z.number(), z.string()]).optional(),
}).passthrough();

export function parsePredictionResponse(raw: unknown): PredictionResult {
  const parsed = PredictionResponseSchema.safeParse(raw);
  if (!parsed.success) throw new Error('Prediction service returned an invalid response.');

  const confidenceValue = parsed.data.confidence;
  const confidence = typeof confidenceValue === 'number'
    ? confidenceValue
    : confidenceValue === undefined
      ? NaN
      : Number(confidenceValue);

  if (!Number.isFinite(confidence)) {
    throw new Error('Prediction service returned an invalid confidence value.');
  }

  return { ...parsed.data, confidence } as PredictionResult;
}

export function normalizePredictionLabel(result: PredictionResult, model: IntelligenceModel) {
  const raw = String(result.disease ?? result.prediction ?? result.class ?? result.label ?? 'Unknown').trim();
  if (model.id === 'cattle-health-classifier') {
    const normalized = raw.toLowerCase().replace(/[_-]+/g, ' ');
    if (normalized.includes('lumpy')) return 'Lumpy Skin Disease';
    if (normalized.includes('foot') && normalized.includes('mouth')) return 'Foot and Mouth Disease';
    if (normalized === 'healthy' || normalized.includes('normal')) return 'Healthy';
  }
  return raw;
}

export async function predict(model: IntelligenceModel, uri: string): Promise<PredictionResult> {
  const baseUrl = INTELLIGENCE_SERVICES[model.service as keyof typeof INTELLIGENCE_SERVICES];
  if (!baseUrl) throw new Error(`The ${model.service} intelligence service is not configured.`);

  const form = new FormData();
  form.append('image', { uri, name: 'capture.jpg', type: 'image/jpeg' } as unknown as Blob);

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${model.predictPath}`, {
    method: 'POST',
    body: form,
  });

  const raw: unknown = await response.json();
  if (!response.ok) {
    const message = raw && typeof raw === 'object' && 'error' in raw && typeof raw.error === 'string' ? raw.error : 'Prediction service failed.';
    throw new Error(message);
  }
  return parsePredictionResponse(raw);
}

export type ReportResponse = {
  structuredReport?: unknown;
  report?: unknown;
  [key: string]: unknown;
};

export async function generateReport(model: IntelligenceModel, input: {
  disease: string;
  confidence: number;
  country: string;
  district?: string;
  cropOrAnimal: string;
}) {
  const baseUrl = INTELLIGENCE_SERVICES[model.service as keyof typeof INTELLIGENCE_SERVICES];
  if (!baseUrl) throw new Error(`The ${model.service} intelligence service is not configured.`);

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${model.reportPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const raw: unknown = await response.json();
  if (!response.ok) {
    const message = raw && typeof raw === 'object' && 'error' in raw && typeof raw.error === 'string' ? raw.error : 'Report service failed.';
    throw new Error(message);
  }
  if (!raw || typeof raw !== 'object') throw new Error('Report service returned an invalid response.');
  return raw as ReportResponse;
}
