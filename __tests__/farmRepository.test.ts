import { stripUndefined } from '@/utils/firestore';

describe('farm Firestore write sanitization', () => {
  it('removes undefined optional fields without changing valid values', () => {
    expect(
      stripUndefined({
        name: 'Test Farm',
        location: undefined,
        latitude: -24.6282,
        longitude: 25.9231,
        description: '',
        size: undefined,
      }),
    ).toEqual({
      name: 'Test Farm',
      latitude: -24.6282,
      longitude: 25.9231,
      description: '',
    });
  });

  it('preserves null values because null can be an intentional Firestore value', () => {
    expect(stripUndefined({ photoURL: null, location: undefined })).toEqual({
      photoURL: null,
    });
  });

  it('does not mutate the original input', () => {
    const input = { name: 'Farm', description: undefined };
    const result = stripUndefined(input);

    expect(result).toEqual({ name: 'Farm' });
    expect(input).toEqual({ name: 'Farm', description: undefined });
  });
});
