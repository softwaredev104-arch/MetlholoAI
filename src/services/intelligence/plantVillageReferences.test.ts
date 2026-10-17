import { PLANTVILLAGE_REFERENCES } from './plantVillageReferences';
import { INTELLIGENCE_MODELS } from './catalog';

describe('PlantVillage image provenance in model capture guides', () => {
  it('shows real labelled reference photos without making a model ready', () => {
    const leafSpot = INTELLIGENCE_MODELS.find(m => m.id === 'maize-leaf-spot');
    expect(leafSpot?.captureExamples).toHaveLength(2);
    expect(leafSpot?.captureExamples?.every(p =>
      p.kind === 'licensed_reference' &&
      p.license === 'CC BY-SA 3.0' &&
      p.uri.includes('raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/') &&
      p.sourceUrl.includes('/blob/')
    )).toBe(true);
  });

  it('does not falsely claim PlantVillage was used for livestock or armyworm', () => {
    for (const modelId of ['cattle-foot-mouth', 'poultry-faeces', 'maize-fall-armyworm']) {
      expect(PLANTVILLAGE_REFERENCES[modelId]).toBeUndefined();
    }
    expect(Object.keys(PLANTVILLAGE_REFERENCES)).toHaveLength(11);
  });
});
