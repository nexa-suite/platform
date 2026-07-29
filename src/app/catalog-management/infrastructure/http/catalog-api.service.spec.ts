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

  it('sends URL filters and maps only commercial catalog fields', () => {
    service.search({ ...DEFAULT_CATALOG_FILTERS, q: 'queso', status: 'ACTIVE', coldChain: 'FROZEN' }).subscribe((page) => {
      expect(page.items[0]?.name).toBe('Queso');
      expect(page.items[0]?.id).toBe('CAT-1');
    });

    const request = httpMock.expectOne('http://api.local/api/v1/catalog-items');
    expect(request.request.params.get('q')).toBe('queso');
    expect(request.request.params.get('status')).toBe('ACTIVE');
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
