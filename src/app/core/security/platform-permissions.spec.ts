import { describe, expect, it } from 'vitest';
import { firstPermittedPlatformLanding, platformLandingForUser, PLATFORM_PERMISSIONS } from './platform-permissions';

describe('platform permission landings', () => {
  it('resolves a landing for a custom role from effective permissions', () => {
    const landing = firstPermittedPlatformLanding(
      (permission) => permission === PLATFORM_PERMISSIONS.salesRead,
    );

    expect(landing?.path).toBe('/ops/commercial/dashboard');
  });

  it('keeps a pure company owner on the owner overview even with tenant permissions', () => {
    const landing = platformLandingForUser(
      { subject: 'owner', identifier: 'owner@nexa.test', displayName: 'Owner', workspaceSlug: 'icisa', roles: ['COMPANY_OWNER'], permissions: [PLATFORM_PERMISSIONS.ownerDashboardRead, PLATFORM_PERMISSIONS.tenantRead] },
      (permission) => permission === PLATFORM_PERMISSIONS.ownerDashboardRead || permission === PLATFORM_PERMISSIONS.tenantRead,
    );
    expect(landing?.path).toBe('/ops/executive-overview');
  });
});
