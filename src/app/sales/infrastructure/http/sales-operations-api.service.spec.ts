import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { SalesOperationsApiService } from './sales-operations-api.service';

describe('SalesOperationsApiService', () => {
  let api: SalesOperationsApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SalesOperationsApiService, provideHttpClient(), provideHttpClientTesting(), { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PLATFORM' } }] });
    api = TestBed.inject(SalesOperationsApiService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('sends client account updates with ETag precondition', () => {
    api.updateClientAccount('CLI-001', 3, { commercialName: 'Updated' }).subscribe();
    const request = http.expectOne((candidate) => candidate.url === 'http://api.local/api/v1/client-accounts/CLI-001');
    expect(request.request.method).toBe('PATCH'); expect(request.request.headers.get('If-Match')).toBe('"3"'); request.flush({});
  });

  it('sends purchase request transition to scoped command endpoint', () => {
    api.transition('PR-001', 4, 'approvals', 'ok').subscribe();
    const request = http.expectOne('http://api.local/api/v1/purchase-requests/PR-001/approvals');
    expect(request.request.method).toBe('POST'); expect(request.request.body).toEqual({ reviewNote: 'ok' }); expect(request.request.headers.get('If-Match')).toBe('"4"'); request.flush({});
  });
});
