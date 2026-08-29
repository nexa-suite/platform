import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { CatalogApiService } from './catalog-api.service';
import { DEFAULT_CATALOG_FILTERS } from '../../domain/models/catalog.models';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';

describe('CatalogApiService', () => {
  let service: CatalogApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PLATFORM' } }
      ]
    });
    service = TestBed.inject(CatalogApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends only supported catalog query filters and maps server pricing evidence', () => {
    service.search({ ...DEFAULT_CATALOG_FILTERS, q: 'queso', status: 'ACTIVE', coldChain: 'FROZEN' }).subscribe((page) => {
      expect(page.items[0]?.name).toBe('Queso');
      expect(page.items[0]?.id).toBe('CAT-1');
      expect(page.items[0]?.unitPrice).toEqual({ amount: 10, currency: 'PEN' });
      expect(page.items[0]?.basePrice).toEqual({ amount: 12.5, currency: 'PEN' });
      expect(page.items[0]?.promotionLabel).toBe('Buyer price');
      expect(page.items[0]?.status).toBe('ACTIVE');
    });

    const request = httpMock.expectOne((candidate) => candidate.url === 'http://api.local/api/v1/catalog-items');
    expect(request.request.params.get('q')).toBe('queso');
    expect(request.request.params.has('status')).toBe(false);
    expect(request.request.params.get('coldChain')).toBe('FROZEN');
    request.flush({
      items: [{
        catalogItemId: 'CAT-1',
        itemName: 'Queso',
        brandName: 'Marca',
        categoryName: 'Lácteos',
        presentation: 'Caja',
        unitPrice: { amount: '12.50', currency: 'PEN' },
        coldChainRequirement: 'FROZEN',
        status: 'ACTIVE',
        availabilityStatus: 'AVAILABLE',
        promotionLabel: 'Buyer price',
        basePrice: { amount: '12.50', currency: 'PEN' },
        effectivePrice: { amount: '10.00', currency: 'PEN' },
        discountAmount: { amount: '2.50', currency: 'PEN' },
        currency: 'PEN',
        image: { url: '/catalog-items/queso.png', fileName: 'queso.png' }
      }],
      page: 0,
      size: 20,
      totalItems: 1,
      totalPages: 1,
      sort: { field: 'itemName', direction: 'asc' }
    });
  });
});
