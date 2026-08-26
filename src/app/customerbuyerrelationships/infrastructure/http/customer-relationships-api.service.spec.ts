import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { CustomerRelationshipsApiService } from './customer-relationships-api.service';

describe('CustomerRelationshipsApiService', () => {
  let api: CustomerRelationshipsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CustomerRelationshipsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PLATFORM' } }
      ]
    });
    api = TestBed.inject(CustomerRelationshipsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('owns client account updates and preserves the API precondition contract', () => {
    api.updateClientAccount('CLI-001', 3, { commercialName: 'Updated' }).subscribe();
    const request = http.expectOne((candidate) => candidate.url === 'http://api.local/api/v1/client-accounts/CLI-001');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.headers.get('If-Match')).toBe('"3"');
    request.flush({ id: 'CLI-001', version: 4 });
  });

  it('does not expose sales commitment commands', () => {
    expect('purchaseRequests' in api).toBe(false);
    expect('salesOrders' in api).toBe(false);
  });
});
