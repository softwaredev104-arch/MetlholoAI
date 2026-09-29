import { INTELLIGENCE_MODELS, getModelsForSubject } from '@/services/intelligence/catalog';

describe('intelligence catalog availability', () => {
  it('marks the currently unavailable production models as coming soon', () => {
    expect(INTELLIGENCE_MODELS.length).toBeGreaterThan(0);
    expect(INTELLIGENCE_MODELS.every(model => model.availability === 'coming_soon')).toBe(true);
  });

  it('preserves model selection by subject while exposing availability', () => {
    const maizeModels = getModelsForSubject('Maize');

    expect(maizeModels.length).toBeGreaterThan(0);
    expect(maizeModels.every(model => model.subject === 'Maize')).toBe(true);
    expect(maizeModels.every(model => model.availability === 'coming_soon')).toBe(true);
  });
});
