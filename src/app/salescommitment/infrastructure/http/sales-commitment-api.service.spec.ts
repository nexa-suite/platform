import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { SalesCommitmentApiService } from './sales-commitment-api.service';

describe('SalesCommitmentApiService', () => {
  let api: SalesCommitmentApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SalesCommitmentApiService, provideHttpClient(), provideHttpClientTesting(), { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PLATFORM' } }] });
    api = TestBed.inject(SalesCommitmentApiService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('sends purchase request transition to scoped command endpoint', () => {
    api.transition('PR-001', 4, 'approvals', 'ok').subscribe();
    const request = http.expectOne('http://api.local/api/v1/purchase-requests/PR-001/approvals');
    expect(request.request.method).toBe('POST'); expect(request.request.body).toEqual({ reviewNote: 'ok' }); expect(request.request.headers.get('If-Match')).toBe('"4"'); request.flush({});
  });

  it('does not expose customer relationship commands', () => {
    expect('clientAccounts' in api).toBe(false);
    expect('updateClientAccount' in api).toBe(false);
  });
});
