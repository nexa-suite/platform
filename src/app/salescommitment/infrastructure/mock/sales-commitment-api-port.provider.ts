import { inject, Provider } from '@angular/core';
import { PLATFORM_RUNTIME_CONFIG, selectRuntimeAdapter } from '../../../core/security/runtime-config';
import { SalesCommitmentApiPort } from '../../domain/ports/sales-commitment-api.port';
import { SalesCommitmentApiService } from '../http/sales-commitment-api.service';
import { MockSalesCommitmentApiService } from './mock-sales-commitment-api.service';

export const salesCommitmentApiPortProvider: Provider = {
  provide: SalesCommitmentApiPort,
  useFactory: () => selectRuntimeAdapter<SalesCommitmentApiPort>(
    inject(PLATFORM_RUNTIME_CONFIG),
    inject(SalesCommitmentApiService),
    inject(MockSalesCommitmentApiService)
  )
};
