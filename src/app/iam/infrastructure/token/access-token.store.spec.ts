import { describe, expect, it } from 'vitest';
import { AccessTokenStore } from './access-token.store';

describe('AccessTokenStore', () => {
  it('keeps the access token only in process memory', () => {
    const store = new AccessTokenStore();
    store.write('access-token');

    expect(store.read()).toBe('access-token');
    expect(Object.keys(store)).toEqual(['token']);

    store.clear();
    expect(store.read()).toBeNull();
  });
});
