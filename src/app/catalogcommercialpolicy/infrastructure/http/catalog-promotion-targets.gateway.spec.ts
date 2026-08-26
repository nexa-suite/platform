import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { CatalogPromotionTargetsGateway } from './catalog-promotion-targets.gateway';

describe('CatalogPromotionTargetsGateway', () => {
  let gateway: CatalogPromotionTargetsGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CatalogPromotionTargetsGateway,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: 'http://api.local', surface: 'PLATFORM' } }
      ]
    });
    gateway = TestBed.inject(CatalogPromotionTargetsGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps the existing client-account contract to Catalog promotion targets', () => {
    let targets: readonly { readonly id: string; readonly code: string; readonly businessName: string; readonly commercialName: string }[] = [];
    gateway.list().subscribe((value) => { targets = value; });

    const request = http.expectOne((candidate) => candidate.url === 'http://api.local/api/v1/client-accounts');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('100');
    request.flush({ items: [{ clientAccountId: 'CLI-1', clientAccountCode: 'C-1', legalName: 'ACME S.A.C.', tradeName: 'ACME' }] });

    expect(targets).toEqual([{ id: 'CLI-1', code: 'C-1', businessName: 'ACME S.A.C.', commercialName: 'ACME' }]);
  });
});
