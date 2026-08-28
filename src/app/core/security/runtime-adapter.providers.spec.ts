import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { PLATFORM_RUNTIME_CONFIG } from './runtime-config';
import { AuthApiPort } from '../../tenantaccessgovernance/iam/domain/ports/auth-api.port';
import { AuthApiService } from '../../tenantaccessgovernance/iam/infrastructure/http/auth-api.service';
import { authApiPortProvider } from '../../tenantaccessgovernance/iam/infrastructure/mock/auth-api-port.provider';
import { MockAuthApiService } from '../../tenantaccessgovernance/iam/infrastructure/mock/mock-auth-api.service';
import { CatalogApiPort } from '../../catalogcommercialpolicy/domain/ports/catalog-api.port';
import { CatalogApiService } from '../../catalogcommercialpolicy/infrastructure/http/catalog-api.service';
import { catalogApiPortProvider } from '../../catalogcommercialpolicy/infrastructure/mock/catalog-api-port.provider';
import { MockCatalogApiService } from '../../catalogcommercialpolicy/infrastructure/mock/mock-catalog-api.service';
import { CustomerRelationshipsApiPort } from '../../customerbuyerrelationships/domain/ports/customer-relationships-api.port';
import { CustomerRelationshipsApiService } from '../../customerbuyerrelationships/infrastructure/http/customer-relationships-api.service';
import { customerRelationshipsApiPortProvider } from '../../customerbuyerrelationships/infrastructure/mock/customer-relationships-api-port.provider';
import { MockCustomerRelationshipsApiService } from '../../customerbuyerrelationships/infrastructure/mock/mock-customer-relationships-api.service';
import { SalesCommitmentApiPort } from '../../salescommitment/domain/ports/sales-commitment-api.port';
import { SalesCommitmentApiService } from '../../salescommitment/infrastructure/http/sales-commitment-api.service';
import { salesCommitmentApiPortProvider } from '../../salescommitment/infrastructure/mock/sales-commitment-api-port.provider';
import { MockSalesCommitmentApiService } from '../../salescommitment/infrastructure/mock/mock-sales-commitment-api.service';

describe('runtime adapter providers', () => {
  afterEach(() => TestBed.resetTestingModule());

  it.each([
    ['api', 'generic'],
    ['mock', 'icisa']
  ] as const)('resolves all selected ports in %s mode', (dataMode, tenantProfile) => {
    const api = { name: 'api' };
    const mock = { name: 'mock' };
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: '', surface: 'PLATFORM', dataMode, tenantProfile } },
        { provide: AuthApiService, useValue: api },
        { provide: CatalogApiService, useValue: api },
        { provide: CustomerRelationshipsApiService, useValue: api },
        { provide: SalesCommitmentApiService, useValue: api },
        { provide: MockAuthApiService, useValue: mock },
        { provide: MockCatalogApiService, useValue: mock },
        { provide: MockCustomerRelationshipsApiService, useValue: mock },
        { provide: MockSalesCommitmentApiService, useValue: mock },
        authApiPortProvider,
        catalogApiPortProvider,
        customerRelationshipsApiPortProvider,
        salesCommitmentApiPortProvider
      ]
    });

    expect(TestBed.inject(AuthApiPort)).toBe(dataMode === 'mock' ? mock : api);
    expect(TestBed.inject(CatalogApiPort)).toBe(dataMode === 'mock' ? mock : api);
    expect(TestBed.inject(CustomerRelationshipsApiPort)).toBe(dataMode === 'mock' ? mock : api);
    expect(TestBed.inject(SalesCommitmentApiPort)).toBe(dataMode === 'mock' ? mock : api);
  });
});
