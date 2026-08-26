import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { SalesCommitmentApiPort } from '../../../salescommitment/domain/ports/sales-commitment-api.port';
import { SalesOrderVersionPort } from '../../domain/ports/inventory-cross-context.ports';

/** ACL exposing only the sales version needed by inventory reservation. */
@Injectable({ providedIn: 'root' })
export class SalesOrderVersionGateway implements SalesOrderVersionPort {
  private readonly sales = inject(SalesCommitmentApiPort);

  currentVersion(salesOrderId: string): Observable<number> {
    return this.sales.salesOrder(salesOrderId).pipe(map((order) => order.version));
  }
}
