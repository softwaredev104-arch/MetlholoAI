import { AgriculturalProductSchema, CropGuidelineSchema, MarketPriceSchema } from './models';

describe('agricultural knowledge contracts', () => {
  const source = { source: 'BAMB', country: 'Botswana', confidence: 'high' as const };

  it('accepts a normalized input record with provenance', () => {
    const product = AgriculturalProductSchema.parse({
      id: 'fert-1',
      category: 'fertilizer',
      productName: 'Example Fertilizer',
      targetCrop: 'Maize',
      publicationStatus: 'published',
      source,
    });
    expect(product.source.source).toBe('BAMB');
    expect(product.category).toBe('fertilizer');
  });

  it('accepts producer-price records separately from products', () => {
    const price = MarketPriceSchema.parse({
      id: 'price-1',
      commodity: 'Maize',
      grade: 1,
      perBagPrice: 150,
      perMtPrice: 3000,
      priceType: 'producer_price',
      source,
      publicationStatus: 'published',
    });
    expect(price.currency).toBe('BWP');
  });

  it('keeps guideline recommendations structured and provenance-backed', () => {
    const guideline = CropGuidelineSchema.parse({
      id: 'guide-1',
      crop: 'Maize',
      problem: 'Aphids',
      recommendations: [{ productName: 'Reference Product', rate: 'Per label' }],
      source,
      publicationStatus: 'published',
    });
    const firstRecommendation = guideline.recommendations[0];
    if (!firstRecommendation) throw new Error('Expected at least one recommendation.');
    expect(firstRecommendation.productName).toBe('Reference Product');
  });
});
