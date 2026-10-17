import { prepareProfessionalReviewDraft } from './professionalReview';

describe('private professional review preparation', () => {
  it('keeps the diagnosis link and symptoms without implying submission', () => {
    expect(prepareProfessionalReviewDraft({
      symptoms: 'Leaf spots across several maize plants',
      notes: 'Other private notes',
      sourceDiagnosisId: 'diagnosis-123',
    }, '2026-10-17T12:00:00Z')).toEqual({
      status: 'draft_not_sent',
      preparedAt: '2026-10-17T12:00:00Z',
      symptoms: 'Leaf spots across several maize plants',
      sourceDiagnosisId: 'diagnosis-123',
    });
  });

  it('supports existing cases that have notes but no structured symptoms', () => {
    expect(prepareProfessionalReviewDraft({
      notes: 'Animal stopped eating yesterday',
    }).symptoms).toBe('Animal stopped eating yesterday');
  });

  it('rejects a review request with no meaningful observations', () => {
    expect(() => prepareProfessionalReviewDraft({
      symptoms: ' ',
      notes: '',
    })).toThrow('Record observed symptoms');
  });
});
