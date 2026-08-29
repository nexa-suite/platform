import { describe, expect, it } from 'vitest';
import { firstPermittedPlatformLanding, platformLandingForUser, platformOperationalRoleForUser, PLATFORM_AREAS, PLATFORM_LANDINGS, PLATFORM_PERMISSIONS } from './platform-permissions';

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

  it('keeps a pure logistics user on dispatch instead of the warehouse landing', () => {
    const landing = platformLandingForUser(
      { subject: 'logistics', identifier: 'logistics@nexa.test', displayName: 'Logistics', workspaceSlug: 'icisa', roles: ['LOGISTICS'], permissions: [PLATFORM_PERMISSIONS.logisticsRead, PLATFORM_PERMISSIONS.warehouseRead] },
      (permission) => permission === PLATFORM_PERMISSIONS.logisticsRead || permission === PLATFORM_PERMISSIONS.warehouseRead,
    );
    expect(landing?.path).toBe('/ops/operations/dispatch-orders');
  });

  it('keeps a multi-role logistics session on the dispatch work area', () => {
    expect(platformOperationalRoleForUser(
      { subject: 'logistics', identifier: 'logistics@nexa.test', displayName: 'Logistics', workspaceSlug: 'icisa', roles: ['WAREHOUSE', 'LOGISTICS'], permissions: [PLATFORM_PERMISSIONS.logisticsRead, PLATFORM_PERMISSIONS.warehouseRead] },
      () => true,
    )).toBe('LOGISTICS');
  });

  it('uses the permission envelope only for custom operational sessions', () => {
    expect(platformOperationalRoleForUser(
      { subject: 'custom', identifier: 'custom@nexa.test', displayName: 'Custom', workspaceSlug: 'icisa', roles: [], permissions: [PLATFORM_PERMISSIONS.warehouseRead] },
      (permission) => permission === PLATFORM_PERMISSIONS.warehouseRead,
    )).toBe('WAREHOUSE');
  });

  it('keeps the canonical internal work areas explicit and leaves BOM outside the current contract', () => {
    expect(Object.keys(PLATFORM_AREAS)).toEqual(['TENANT_ADMIN', 'COMPANY_OWNER', 'SALES', 'WAREHOUSE', 'LOGISTICS']);
    expect(PLATFORM_AREAS.COMPANY_OWNER.path).toBe('/ops/executive-overview');
    expect(PLATFORM_AREAS.SALES.path).toBe('/ops/commercial/dashboard');
    expect(PLATFORM_AREAS.WAREHOUSE.path).toBe('/ops/operations/dashboard');
    expect(PLATFORM_AREAS.LOGISTICS.path).toBe('/ops/operations/dispatch-orders');
    expect(PLATFORM_LANDINGS.LOGISTICS.path).toBe('/ops/operations/dispatch-orders');
    expect('BOM' in PLATFORM_AREAS).toBe(false);
  });
});
