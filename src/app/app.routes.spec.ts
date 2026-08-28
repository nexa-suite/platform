import { describe, expect, it } from 'vitest';
import { CustomerRelationshipsApiService } from './customerbuyerrelationships/infrastructure/http/customer-relationships-api.service';
import { CatalogPromotionTargetsGateway } from './catalogcommercialpolicy/infrastructure/http/catalog-promotion-targets.gateway';
import { SalesCommitmentApiService } from './salescommitment/infrastructure/http/sales-commitment-api.service';
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

  it('keeps the operational catalog entry point separate from the administration list', () => {
    const shell = routes.find((route) => route.path === '');
    const alias = shell?.children?.find((route) => route.path === 'ops/product-catalog');
    expect(alias?.loadComponent).toBeTypeOf('function');
    expect(alias?.redirectTo).toBeUndefined();
    expect(alias?.pathMatch).toBe('full');
  });

  it('protects the business-document feature with the canonical document permission', () => {
    const shell = routes.find((route) => route.path === '');
    const route = shell?.children?.find((candidate) => candidate.path === 'ops/operations/business-documents');
    expect(route?.canActivate).toBeTruthy();
  });

  it('protects the bank-transfer review queue with reconciliation permission', () => {
    const shell = routes.find((route) => route.path === '');
    const route = shell?.children?.find((candidate) => candidate.path === 'ops/finance/bank-transfers');
    expect(route?.canActivate).toBeTruthy();
  });

  it('keeps the canonical legacy aliases ahead of wildcard navigation', () => {
    const shell = routes.find((route) => route.path === '');
    const paths = new Set((shell?.children ?? []).map((route) => route.path));
    expect([...paths]).toEqual(expect.arrayContaining([
      'ops/commercial/purchase-orders',
      'ops/commercial/purchase-orders/:salesOrderId',
      'ops/commercial/manual-order-entry',
      'ops/commercial/promotions',
      'ops/commercial/business-documents',
      'ops/commercial/business-documents/orders/:orderId',
      'ops/operations/inventory-control',
      'ops/operations/inventory-lots',
      'ops/operations/business-documents/orders/:orderId',
      'ops/profile'
    ]));
    const documentDetail = (shell?.children ?? []).find((route) => route.path === 'ops/operations/business-documents/orders/:orderId');
    const documentList = (shell?.children ?? []).find((route) => route.path === 'ops/operations/business-documents');
    expect((shell?.children ?? []).indexOf(documentDetail!)).toBeLessThan((shell?.children ?? []).indexOf(documentList!));
  });

  it('keeps the commercial dashboard under Sales Commitment ownership', () => {
    const shell = routes.find((route) => route.path === '');
    const route = shell?.children?.find((candidate) => candidate.path === 'ops/commercial/dashboard');
    expect(route?.loadComponent).toBeTypeOf('function');
    expect(route?.providers).toContain(SalesCommitmentApiService);
  });

  it('uses the Catalog promotion-target gateway instead of the Customer API client', () => {
    const shell = routes.find((route) => route.path === '');
    const route = shell?.children?.find((candidate) => candidate.path === 'ops/catalog/promotions/new');
    expect(route?.providers).toContain(CatalogPromotionTargetsGateway);
    expect(route?.providers).not.toContain(CustomerRelationshipsApiService);
  });
});
