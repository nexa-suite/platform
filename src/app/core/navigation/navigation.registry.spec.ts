import { describe, expect, it } from 'vitest';
import { PLATFORM_NAVIGATION } from './navigation.registry';

describe('Platform navigation registry', () => {
  it('exposes catalog only to the approved internal catalog roles', () => {
    const catalog = PLATFORM_NAVIGATION.find((item) => item.path === '/ops/catalog');

    expect(catalog).toMatchObject({
      labelKey: 'catalog.navigation.catalog',
      icon: 'inventory_2',
      permission: 'catalog:read',
      roles: ['COMPANY_OWNER', 'SALES', 'WAREHOUSE', 'LOGISTICS']
    });
    expect(catalog?.icon.trim()).toBe(catalog?.icon);
    expect(catalog?.roles).not.toContain('TENANT_ADMIN');
    expect(catalog?.roles).not.toContain('BUYER');
  });
});
