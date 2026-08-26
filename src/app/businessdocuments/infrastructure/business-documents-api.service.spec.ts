import '@angular/compiler';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { PLATFORM_RUNTIME_CONFIG } from '../../core/security/runtime-config';
import { BusinessDocumentsApiService } from './business-documents-api.service';

describe('BusinessDocumentsApiService', () => {
  let api: BusinessDocumentsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [BusinessDocumentsApiService, provideHttpClient(), provideHttpClientTesting(), { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PLATFORM' } }] });
    api = TestBed.inject(BusinessDocumentsApiService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lists documents in the tenant API scope', () => {
    api.list().subscribe((page) => expect(page.total).toBe(1));
    const request = http.expectOne('http://api.local/api/v1/business-documents?page=0&size=25');
    expect(request.request.method).toBe('GET'); request.flush({ items: [], page: 0, size: 25, total: 1 });
  });

  it('sends an idempotency key for generation', () => {
    api.requestGeneration({ subjectType: 'SALES_ORDER', subjectId: 'order-1', documentType: 'ORDER_SUMMARY', format: 'PDF' }, 'documents-1').subscribe();
    const request = http.expectOne('http://api.local/api/v1/business-document-generation-requests');
    expect(request.request.headers.get('Idempotency-Key')).toBe('documents-1'); request.flush({});
  });
});
