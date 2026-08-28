import { inject, Provider } from '@angular/core';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { CatalogPromotionTargetsPort } from '../../domain/ports/catalog-promotion-targets.port';
import { CatalogPromotionTargetsGateway } from '../http/catalog-promotion-targets.gateway';
import { MockCatalogPromotionTargetsGateway } from './mock-catalog-promotion-targets.gateway';

export const catalogPromotionTargetsPortProvider: Provider = { provide: CatalogPromotionTargetsPort, useFactory: () => inject(PLATFORM_RUNTIME_CONFIG).dataMode === 'mock' ? inject(MockCatalogPromotionTargetsGateway) : inject(CatalogPromotionTargetsGateway) };
