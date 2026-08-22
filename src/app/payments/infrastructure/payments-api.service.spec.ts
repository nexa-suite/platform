import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PLATFORM_RUNTIME_CONFIG } from '../../core/security/runtime-config';
import { PaymentsApiService } from './payments-api.service';

describe('PaymentsApiService', () => {
  let api: PaymentsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PaymentsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PLATFORM' } },
      ],
    });
    api = TestBed.inject(PaymentsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the tenant-scoped pending transfer queue', () => {
    api.listPendingBankTransfers().subscribe();
    const request = http.expectOne((candidate) => candidate.url === 'http://api.local/api/v1/payments');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('method')).toBe('BANK_TRANSFER');
    expect(request.request.params.get('status')).toBe('PROCESSING');
    request.flush({ items: [], page: 0, size: 25, total: 0 });
  });

  it('keeps review actions idempotent', () => {
    api.rejectBankTransfer('payment/1', 'Reference mismatch', '00000000-0000-4000-8000-000000000001').subscribe();
    const request = http.expectOne('http://api.local/api/v1/payments/payment%2F1/bank-transfer/reject');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ reason: 'Reference mismatch' });
    expect(request.request.headers.get('Idempotency-Key')).toBe('00000000-0000-4000-8000-000000000001');
    request.flush({});
  });
});
