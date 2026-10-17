import { approvedCaptureExamples, captureTips, GENERAL_CAPTURE_TIPS } from './captureGuidance';
import { gatewayModel } from './catalog';

const example = {
  image_url: 'https://example.org/photo.jpg',
  source_url: 'https://example.org/source',
  title: 'A reference leaf',
  attribution: 'Research group',
  license: 'CC BY 4.0',
  redistribution_allowed: true,
};

describe('model capture guidance', () => {
  it('requires verified training membership before displaying training claims', () => {
    expect(approvedCaptureExamples([{
      ...example, kind: 'verified_training',
    }])).toEqual([]);
    expect(approvedCaptureExamples([{
      ...example, kind: 'verified_training', training_membership_verified: true,
    }])[0]?.kind).toBe('verified_training');
  });

  it('permits properly attributed reference images without calling them training examples', () => {
    const approved = approvedCaptureExamples([{ ...example, kind: 'licensed_reference' }]);
    expect(approved).toHaveLength(1);
    expect(approved[0]?.kind).toBe('licensed_reference');
    expect(approvedCaptureExamples([{
      ...example, kind: 'licensed_reference', image_url: 'http://insecure.test/photo',
    }])).toEqual([]);
    expect(approvedCaptureExamples([{
      ...example, kind: 'licensed_reference', redistribution_allowed: false,
    }])).toEqual([]);
  });

  it('returns model-specific photography guidance for livestock, fruits and pests', () => {
    const make = (category: 'livestock' | 'fruits' | 'pests') =>
      gatewayModel({ id: category, category, name: 'Example', subject: 'Test', ready: true });
    expect(captureTips(make('livestock')).join(' ')).toContain('animal');
    expect(captureTips(make('fruits')).join(' ')).toContain('fruit');
    expect(captureTips(make('pests')).join(' ')).toContain('insect');
    expect(GENERAL_CAPTURE_TIPS).toHaveLength(5);
  });
});
