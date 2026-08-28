import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { DEFAULT_CLIENT_ACCOUNT_FILTERS } from '../../domain/client-account.models';
import { MockCustomerRelationshipsApiService } from './mock-customer-relationships-api.service';

describe('MockCustomerRelationshipsApiService', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('exposes the ICISA account through the BC-02 contract', async () => {
    const service = configure('icisa');
    const page = await firstValueFrom(service.clientAccounts({ ...DEFAULT_CLIENT_ACCOUNT_FILTERS, q: 'ICISA' }));

    expect(page.items).toHaveLength(2);
    expect(page.items.map((item) => item.id)).toEqual(expect.arrayContaining(['icisa-client-001', 'icisa-client-002']));
    expect((await firstValueFrom(service.clientAccountAddresses('icisa-client-001')))[0]?.defaultAddress).toBe(true);
  });

  it('keeps address changes deterministic and versioned', async () => {
    const service = configure('generic');
    const address = await firstValueFrom(service.createClientAccountAddress('generic-client-001', {
      label: 'Demo secondary address',
      defaultAddress: false,
      address: {
        addressType: 'WAREHOUSE',
        line: 'Av. Nueva 456, Lima',
        reference: 'Puerta lateral',
        countryCode: 'PE',
        departmentCode: 'LIM',
        provinceCode: 'LIM',
        districtCode: 'SMP',
        streetName: 'Nueva',
        streetNumber: '456'
      }
    }));

    expect(address.id).toBe('generic-address-002');
    expect(address.version).toBe(0);
    const deactivated = await firstValueFrom(service.deactivateClientAccountAddress(address.clientAccountId, address.id, address.version));
    expect(deactivated.active).toBe(false);
    expect(deactivated.version).toBe(1);
  });

  function configure(tenantProfile: 'generic' | 'icisa'): MockCustomerRelationshipsApiService {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: '', surface: 'PLATFORM', dataMode: 'mock', tenantProfile } },
        MockCustomerRelationshipsApiService
      ]
    });
    return TestBed.inject(MockCustomerRelationshipsApiService);
  }
});
