import { inject, Provider } from '@angular/core';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { PaymentsApiPort } from '../../domain/ports/payments-api.port';
import { PaymentsApiService } from '../payments-api.service';
import { MockPaymentsApiService } from './mock-payments-api.service';

export const paymentsApiPortProvider: Provider = {
  provide: PaymentsApiPort,
  useFactory: () => inject(PLATFORM_RUNTIME_CONFIG).dataMode === 'mock' ? inject(MockPaymentsApiService) : inject(PaymentsApiService),
};
