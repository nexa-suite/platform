import { Observable } from 'rxjs';
import { InventoryCatalogReference } from '../inventory-catalog-reference.models';

/** BC-03 catalog read model consumed through the inventory ACL. */
export abstract class InventoryCatalogPort {
  abstract activeItems(): Observable<readonly InventoryCatalogReference[]>;
}

/** BC-04 order version lookup consumed through the inventory ACL. */
export abstract class SalesOrderVersionPort {
  abstract currentVersion(salesOrderId: string): Observable<number>;
}
