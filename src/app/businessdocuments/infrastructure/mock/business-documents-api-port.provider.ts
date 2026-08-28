import { inject, Provider } from '@angular/core';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { BusinessDocumentsApiPort } from '../../domain/ports/business-documents-api.port';
import { BusinessDocumentsApiService } from '../business-documents-api.service';
import { MockBusinessDocumentsApiService } from './mock-business-documents-api.service';

export const businessDocumentsApiPortProvider: Provider = {
  provide: BusinessDocumentsApiPort,
  useFactory: () => inject(PLATFORM_RUNTIME_CONFIG).dataMode === 'mock' ? inject(MockBusinessDocumentsApiService) : inject(BusinessDocumentsApiService),
};
