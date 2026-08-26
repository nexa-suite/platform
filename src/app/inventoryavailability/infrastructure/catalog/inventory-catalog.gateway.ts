import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CatalogManagementApiPort } from '../../../catalogcommercialpolicy/domain/ports/catalog-management-api.port';
import { InventoryCatalogReference } from '../../domain/inventory-catalog-reference.models';
import { InventoryCatalogPort } from '../../domain/ports/inventory-cross-context.ports';

/** ACL from Catalog & Commercial Policy into Inventory Availability. */
@Injectable({ providedIn: 'root' })
export class InventoryCatalogGateway implements InventoryCatalogPort {
  private readonly catalog = inject(CatalogManagementApiPort);

  activeItems(): Observable<readonly InventoryCatalogReference[]> {
    return this.catalog.products('', 'ACTIVE').pipe(map((page) => page.items.map((item) => ({
      id: item.id,
      catalogItemId: item.catalogItemId,
      productCode: item.productCode,
      name: item.name,
    }))));
  }
}
