import { describe, expect, it } from 'vitest';
import { PLATFORM_ROUTES, safeReturnUrl } from './route-paths';

describe('platform return URLs', () => {
  it('keeps an internal route and its query string', () => {
    expect(safeReturnUrl('/ops/commercial/dashboard?tab=pending')).toBe('/ops/commercial/dashboard?tab=pending');
  });

  it('rejects external, encoded network-path and authentication destinations', () => {
    expect(safeReturnUrl('https://evil.example')).toBe(PLATFORM_ROUTES.landing);
    expect(safeReturnUrl('//evil.example/redirect')).toBe(PLATFORM_ROUTES.landing);
    expect(safeReturnUrl('/%2F%2Fevil.example')).toBe(PLATFORM_ROUTES.landing);
    expect(safeReturnUrl('/foo/%2e%2e/sign-in')).toBe(PLATFORM_ROUTES.landing);
    expect(safeReturnUrl('/sign-in')).toBe(PLATFORM_ROUTES.landing);
  });
});
