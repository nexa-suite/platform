import { inject, Provider } from '@angular/core';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { InventoryCatalogPort, SalesOrderVersionPort } from '../../domain/ports/inventory-cross-context.ports';
import { InventoryCatalogGateway } from '../catalog/inventory-catalog.gateway';
import { SalesOrderVersionGateway } from '../sales/sales-order-version.gateway';
import { MockInventoryCatalogGateway, MockSalesOrderVersionGateway } from './mock-inventory-cross-context';

export const inventoryCatalogPortProvider: Provider = {
  provide: InventoryCatalogPort,
  useFactory: () => inject(PLATFORM_RUNTIME_CONFIG).dataMode === 'mock' ? inject(MockInventoryCatalogGateway) : inject(InventoryCatalogGateway),
};

export const salesOrderVersionPortProvider: Provider = {
  provide: SalesOrderVersionPort,
  useFactory: () => inject(PLATFORM_RUNTIME_CONFIG).dataMode === 'mock' ? inject(MockSalesOrderVersionGateway) : inject(SalesOrderVersionGateway),
};
