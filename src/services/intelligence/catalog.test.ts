import {
  INTELLIGENCE_MODELS,
  gatewayModel,
  getModels,
} from './catalog';

describe('MetlholoAI inference catalogue', () => {
  it('keeps existing model endpoints and report paths', () => {
    const maize = INTELLIGENCE_MODELS.find(model => model.id === 'maize-fall-armyworm');
    expect(maize?.predictPath).toContain('/predict');
    expect(maize?.reportPath).toContain('/generate-report');
    expect(getModels('crops').length).toBeGreaterThan(0);
  });

  it('routes poultry to its own configured service rather than cattle', () => {
    expect(INTELLIGENCE_MODELS.find(model => model.id === 'poultry-faeces')?.service).toBe('poultry');
  });

  it('creates a dynamic candidate from an installed gateway model only', () => {
    const item = gatewayModel({
      id: 'mango-1', name: 'Mango Field Model', category: 'fruits',
      subject: 'Mango', ready: true, validated_for_botswana: false,
    });
    expect(item.provider).toBe('gateway');
    expect(item.configured).toBe(true);
    expect(item.validatedForBotswana).toBe(false);
    expect(item.predictPath).toBe('/v1/predict');
    expect(item.reportPath).toBe('/v1/report');
  });
});
