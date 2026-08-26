import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PLATFORM_RUNTIME_CONFIG } from '../../core/security/runtime-config';
import { WarehouseOperationsApiService } from './warehouse-operations-api.service';

describe('WarehouseOperationsApiService', () => {
  let api: WarehouseOperationsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WarehouseOperationsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PLATFORM' } },
      ],
    });
    api = TestBed.inject(WarehouseOperationsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('preserves a caller idempotency key for a retried inbound receipt', () => {
    const payload = { warehouseId: 'WH-1', zoneId: 'ZONE-1', catalogItemId: 'CAT-1', skuId: 'SKU-1', batchNumber: 'B-1', expirationDate: '2099-01-01', quantity: 4, unit: 'UNIT' };
    api.receive(payload, 'inbound-retry-1').subscribe();

    const request = http.expectOne('http://api.local/api/v1/inventory/inbound-receipts');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    expect(request.request.headers.get('Idempotency-Key')).toBe('inbound-retry-1');
    request.flush({});
  });

  it('keeps fulfillment reservation path, ETag and idempotency contract intact', () => {
    api.reserve('ORDER/1', 7, 'reservation-retry-1').subscribe();

    const request = http.expectOne('http://api.local/api/v1/fulfillment-candidates/ORDER%2F1/inventory-reservations');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    expect(request.request.headers.get('If-Match')).toBe('"7"');
    expect(request.request.headers.get('Idempotency-Key')).toBe('reservation-retry-1');
    request.flush({});
  });
});
