/**
 * jest-expo provides fetch through a lazy Expo module getter. Jest coverage
 * enumeration can accidentally evaluate it after a test is torn down,
 * emitting "Cannot log after tests are done" and failing CI.
 * Unit tests install their own fetch mocks; no real HTTP should be used.
 */
Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  writable: true,
  value: jest.fn(async () => {
    throw new Error('Unexpected network request in a unit test.');
  }),
});
