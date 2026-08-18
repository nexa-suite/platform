import { describe, expect, it } from 'vitest';
import { PLATFORM_NAVIGATION } from './navigation.registry';

describe('Platform navigation registry', () => {
  it('exposes catalog through its backend permission contract', () => {
    const catalog = PLATFORM_NAVIGATION.find((item) => item.path === '/ops/catalog');

    expect(catalog).toMatchObject({
      labelKey: 'catalog.navigation.catalog',
      icon: 'inventory_2',
      permission: 'catalog:read'
    });
    expect(catalog?.icon.trim()).toBe(catalog?.icon);
  });

  it('requires every sidebar item to declare the permission of its protected route', () => {
    expect(PLATFORM_NAVIGATION.every((item) => item.permission.trim().length > 0)).toBe(true);
  });
});
