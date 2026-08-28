import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { InventoryCatalogReference } from '../../domain/inventory-catalog-reference.models';
import { InventoryCatalogPort, SalesOrderVersionPort } from '../../domain/ports/inventory-cross-context.ports';

/** BC-05 local ACL projections used when the runtime is offline. */
@Injectable({ providedIn: 'root' })
export class MockInventoryCatalogGateway extends InventoryCatalogPort {
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  activeItems(): Observable<readonly InventoryCatalogReference[]> {
    const profile = this.config.tenantProfile;
    const prefix = profile === 'icisa' ? 'ICISA' : 'GEN';
    return of([
      { id: `${profile}-catalog-001`, catalogItemId: `${profile}-catalog-001`, productCode: `${prefix}-SKU-001`, name: profile === 'icisa' ? 'Queso Gouda Natural' : 'Demo Gouda Natural' },
      { id: `${profile}-catalog-002`, catalogItemId: `${profile}-catalog-002`, productCode: `${prefix}-SKU-002`, name: profile === 'icisa' ? 'Salame Milano' : 'Demo Salted Butter' },
      { id: `${profile}-catalog-003`, catalogItemId: `${profile}-catalog-003`, productCode: `${prefix}-SKU-003`, name: profile === 'icisa' ? 'Queso Parmigiano Reggiano DOP' : 'Demo Panna Cotta Caramel' }
    ]);
  }
}

@Injectable({ providedIn: 'root' })
export class MockSalesOrderVersionGateway extends SalesOrderVersionPort {
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  currentVersion(salesOrderId: string): Observable<number> {
    const profile = this.config.tenantProfile;
    const versions: Readonly<Record<string, number>> = {
      [`${profile}-sales-order-001`]: 0,
      [`${profile}-sales-order-002`]: 1
    };
    return of(versions[salesOrderId] ?? 0);
  }
}
