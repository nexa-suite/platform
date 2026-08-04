import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { CatalogManagementApiService } from './catalog-management-api.service';

describe('CatalogManagementApiService canonical catalog boundary', () => {
  let service: CatalogManagementApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CatalogManagementApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PLATFORM' } }
      ]
    });
    service = TestBed.inject(CatalogManagementApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads ProductFamily and SellableSku projections from canonical resources', () => {
    service.families().subscribe((page) => expect(page.items[0]).toMatchObject({ id: 'family-1', name: 'QUESO GOUDA NATURAL', skuCount: 2, imagePath: '/catalog-items/gouda.png' }));
    const familyRequest = http.expectOne('http://api.local/api/v1/product-families?page=0&size=100');
    familyRequest.flush({ items: [{ id: 'family-1', code: 'FAM-CAT-0022', name: 'QUESO GOUDA NATURAL', description: 'Family', categoryId: 'category-1', categoryName: 'Cheese', brandId: 'brand-1', brandName: 'Agriform', countryOfOrigin: 'ES', manufacturerReference: null, supplierReference: null, storageFamily: 'REFRIGERATED', status: 'ACTIVE', skuCount: 2, imagePath: '/catalog-items/gouda.png', imageFileName: 'gouda.png', version: 0, createdAt: '2026-08-04T00:00:00Z', updatedAt: '2026-08-04T00:00:00Z' }], page: 0, size: 100, total: 1, totalPages: 1 });

    service.skus('', 'family-1').subscribe((page) => expect(page.items[0]).toMatchObject({ id: 'sku-1', familyName: 'QUESO GOUDA NATURAL', skuCode: 'PROD-0022', presentation: 'CORTE', availabilityStatus: 'AVAILABLE', imagePath: '/catalog-items/gouda.png' }));
    const skuRequest = http.expectOne((request) => request.url === 'http://api.local/api/v1/skus' && request.params.get('familyId') === 'family-1');
    skuRequest.flush({ items: [{ id: 'sku-1', familyId: 'family-1', familyCode: 'FAM-CAT-0022', familyName: 'QUESO GOUDA NATURAL', categoryName: 'Cheese', brandName: 'Agriform', skuCode: 'PROD-0022', gtin: null, presentation: 'CORTE', packagingType: 'UNSPECIFIED', unitOfMeasure: 'UNIT', netWeight: 1, grossWeight: 1, packQuantity: 1, temperatureMin: 2, temperatureMax: 8, shelfLifeDays: 30, minimumRemainingShelfLifeDays: 3, lotTrackingRequired: true, expiryTrackingRequired: true, taxCategory: 'STANDARD', status: 'ACTIVE', visible: true, version: 0, legacyCatalogItemId: 'CAT-0022', imagePath: '/catalog-items/gouda.png', imageFileName: 'gouda.png', availabilityStatus: 'AVAILABLE', nearExpiry: false, availabilityAsOf: '2026-08-04T00:00:00Z', currentPrice: { id: 'price-1', skuId: 'sku-1', amount: 20, currency: 'PEN', validFrom: '2026-08-04T00:00:00Z', validUntil: null, sourceCode: 'SEED', sourceDescription: 'Seed', version: 0, cancelled: false }, createdAt: '2026-08-04T00:00:00Z', updatedAt: '2026-08-04T00:00:00Z' }], page: 0, size: 100, total: 1, totalPages: 1 });

    service.prices('sku-1').subscribe((prices) => expect(prices[0]?.skuId).toBe('sku-1'));
    const priceRequest = http.expectOne('http://api.local/api/v1/skus/sku-1/prices');
    priceRequest.flush([{ id: 'price-1', skuId: 'sku-1', amount: 20, currency: 'PEN', validFrom: '2026-08-04T00:00:00Z', validUntil: null, sourceCode: 'SEED', sourceDescription: 'Seed', version: 0, cancelled: false }]);
  });
});
