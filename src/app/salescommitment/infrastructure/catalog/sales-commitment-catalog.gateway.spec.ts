import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CatalogApiPort } from '../../../catalogcommercialpolicy/domain/ports/catalog-api.port';
import { SalesCommitmentCatalogGateway } from './sales-commitment-catalog.gateway';

describe('SalesCommitmentCatalogGateway', () => {
  it('maps only the catalog reference needed by Sales Commitment', () => {
    const catalog = {
      search: vi.fn(() => of({
        items: [{ id: 'cat-1', productFamilyName: 'Queso', skuCode: 'SKU-1', name: 'Queso', presentation: '500 g', image: { url: null, fileName: null }, brand: 'Brand', category: 'Dairy', unitOfMeasure: 'UNIT', packagingType: null, netWeight: null, grossWeight: null, unitPrice: { amount: 10, currency: 'PEN' }, availabilityStatus: 'AVAILABLE' }],
        page: 0, size: 100, totalItems: 1, totalPages: 1,
      })),
    };
    TestBed.configureTestingModule({ providers: [SalesCommitmentCatalogGateway, { provide: CatalogApiPort, useValue: catalog }] });

    TestBed.inject(SalesCommitmentCatalogGateway).search('queso').subscribe((page) => {
      expect(page.items[0]).toEqual(expect.objectContaining({ id: 'cat-1', name: 'Queso' }));
    });
    expect(catalog.search).toHaveBeenCalledWith(expect.objectContaining({ q: 'queso', status: 'ACTIVE', size: 100 }));
  });
});
