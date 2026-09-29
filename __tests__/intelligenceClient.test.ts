import { normalizePredictionLabel, parsePredictionResponse } from '@/services/intelligence/client';

const cattle = {
  id: 'cattle-health-classifier',
  name: 'Cattle Health Classifier',
  category: 'livestock' as const,
  subject: 'Cattle',
  service: 'cattle',
  predictPath: '/api/livestock/cattle/predict',
  reportPath: '/api/livestock/cattle/generate-report',
  input: 'image' as const,
  trainingImageHints: [],
  availability: 'coming_soon' as const,
};

describe('prediction response contract', () => {
  it('accepts numeric confidence', () => {
    expect(parsePredictionResponse({ prediction: 'healthy', confidence: 0.97 })).toMatchObject({ confidence: 0.97 });
  });

  it('normalizes string confidence', () => {
    expect(parsePredictionResponse({ disease: 'lumpy', confidence: '0.95' })).toMatchObject({ confidence: 0.95 });
  });

  it('rejects missing or invalid confidence', () => {
    expect(() => parsePredictionResponse({ prediction: 'healthy' })).toThrow('invalid confidence');
    expect(() => parsePredictionResponse({ prediction: 'healthy', confidence: 'not-a-number' })).toThrow('invalid confidence');
  });

  it('normalizes cattle disease labels', () => {
    expect(normalizePredictionLabel({ prediction: 'lumpy_skin_disease', confidence: 0.95 }, cattle)).toBe('Lumpy Skin Disease');
    expect(normalizePredictionLabel({ prediction: 'foot-and-mouth', confidence: 0.95 }, cattle)).toBe('Foot and Mouth Disease');
  });
});
