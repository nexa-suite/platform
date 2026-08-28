import { inject, Provider } from '@angular/core';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { CatalogManagementApiPort } from '../../domain/ports/catalog-management-api.port';
import { CatalogManagementApiService } from '../http/catalog-management-api.service';
import { MockCatalogManagementApiService } from './mock-catalog-management-api.service';

export const catalogManagementApiPortProvider: Provider = { provide: CatalogManagementApiPort, useFactory: () => inject(PLATFORM_RUNTIME_CONFIG).dataMode === 'mock' ? inject(MockCatalogManagementApiService) : inject(CatalogManagementApiService) };
