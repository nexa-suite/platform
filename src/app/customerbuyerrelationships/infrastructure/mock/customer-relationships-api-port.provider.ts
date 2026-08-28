import { inject, Provider } from '@angular/core';
import { PLATFORM_RUNTIME_CONFIG, selectRuntimeAdapter } from '../../../core/security/runtime-config';
import { CustomerRelationshipsApiPort } from '../../domain/ports/customer-relationships-api.port';
import { CustomerRelationshipsApiService } from '../http/customer-relationships-api.service';
import { MockCustomerRelationshipsApiService } from './mock-customer-relationships-api.service';

export const customerRelationshipsApiPortProvider: Provider = {
  provide: CustomerRelationshipsApiPort,
  useFactory: () => selectRuntimeAdapter<CustomerRelationshipsApiPort>(
    inject(PLATFORM_RUNTIME_CONFIG),
    inject(CustomerRelationshipsApiService),
    inject(MockCustomerRelationshipsApiService)
  )
};
