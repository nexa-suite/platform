import { inject, Provider } from '@angular/core';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { WarehouseOperationsApiPort } from '../../domain/ports/warehouse-operations-api.port';
import { MockWarehouseOperationsApiService } from './mock-warehouse-operations-api.service';
import { WarehouseOperationsApiService } from '../warehouse-operations-api.service';

export const warehouseOperationsApiPortProvider: Provider = {
  provide: WarehouseOperationsApiPort,
  useFactory: () => inject(PLATFORM_RUNTIME_CONFIG).dataMode === 'mock' ? inject(MockWarehouseOperationsApiService) : inject(WarehouseOperationsApiService),
};
