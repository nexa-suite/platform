import { inject, Provider } from '@angular/core';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { LogisticsApiPort } from '../../domain/ports/logistics-api.port';
import { LogisticsApiService } from '../logistics-api.service';
import { MockLogisticsApiService } from './mock-logistics-api.service';

export const logisticsApiPortProvider: Provider = {
  provide: LogisticsApiPort,
  useFactory: () => inject(PLATFORM_RUNTIME_CONFIG).dataMode === 'mock' ? inject(MockLogisticsApiService) : inject(LogisticsApiService),
};
