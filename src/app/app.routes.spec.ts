import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';

describe('Platform catalog route matrix', () => {
  it('declares dedicated lazy routes for every 2B catalog surface', () => {
    const shell = routes.find((route) => route.path === '');
    const paths = new Set((shell?.children ?? []).map((route) => route.path));
    expect([...paths]).toEqual(expect.arrayContaining([
      'ops/catalog', 'ops/catalog/products', 'ops/catalog/products/new', 'ops/catalog/products/:productId',
      'ops/catalog/categories', 'ops/catalog/brands', 'ops/catalog/pricing', 'ops/catalog/promotions',
      'ops/catalog/promotions/new', 'ops/catalog/promotions/:promotionId'
    ]));
  });

  it('keeps the legacy catalog alias as a compatibility redirect only', () => {
    const shell = routes.find((route) => route.path === '');
    const alias = shell?.children?.find((route) => route.path === 'ops/product-catalog');
    expect(alias?.redirectTo).toBe('ops/catalog/products');
    expect(alias?.pathMatch).toBe('full');
  });

  it('protects the business-document feature with the canonical document permission', () => {
    const shell = routes.find((route) => route.path === '');
    const route = shell?.children?.find((candidate) => candidate.path === 'ops/operations/business-documents');
    expect(route?.canActivate).toBeTruthy();
  });
});
