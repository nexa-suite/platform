import { inject, Provider } from '@angular/core';
import { PLATFORM_RUNTIME_CONFIG, selectRuntimeAdapter } from '../../../core/security/runtime-config';
import { CatalogApiPort } from '../../domain/ports/catalog-api.port';
import { CatalogApiService } from '../http/catalog-api.service';
import { MockCatalogApiService } from './mock-catalog-api.service';

export const catalogApiPortProvider: Provider = {
  provide: CatalogApiPort,
  useFactory: () => selectRuntimeAdapter<CatalogApiPort>(
    inject(PLATFORM_RUNTIME_CONFIG),
    inject(CatalogApiService),
    inject(MockCatalogApiService)
  )
};
