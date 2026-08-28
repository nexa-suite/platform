import { Injectable, inject } from '@angular/core';
import { catchError, defer, forkJoin, map, Observable, of, shareReplay } from 'rxjs';
import { PlatformNavigationBadges } from '../../../core/navigation/platform-navigation-badge.port';
import { PlatformAuthenticationBoundary } from '../../../core/security/platform-authentication.boundary';
import { DEFAULT_PURCHASE_REQUEST_FILTERS } from '../../domain/purchase-requests/purchase-request.models';
import { DEFAULT_SALES_ORDER_FILTERS } from '../../domain/sales-orders/sales-order.models';
import { SalesCommitmentApiPort } from '../../domain/ports/sales-commitment-api.port';

/** Sales-owned pending-work counts exposed to the shell through a small ACL. */
@Injectable({ providedIn: 'root' })
export class SalesNavigationBadgeService {
  private readonly api = inject(SalesCommitmentApiPort);
  private readonly authentication = inject(PlatformAuthenticationBoundary);

  readonly values: Observable<PlatformNavigationBadges> = defer(() => {
    if (!this.authentication.hasPermission('sales:read')) return of({} as PlatformNavigationBadges);
    return forkJoin({
      submitted: this.api.purchaseRequests({ ...DEFAULT_PURCHASE_REQUEST_FILTERS, status: 'SUBMITTED', size: 1 }),
      inReview: this.api.purchaseRequests({ ...DEFAULT_PURCHASE_REQUEST_FILTERS, status: 'IN_REVIEW', size: 1 }),
      needsAdjustment: this.api.purchaseRequests({ ...DEFAULT_PURCHASE_REQUEST_FILTERS, status: 'NEEDS_ADJUSTMENT', size: 1 }),
      pendingOrders: this.api.salesOrders({ ...DEFAULT_SALES_ORDER_FILTERS, status: 'PENDING', size: 1 }),
    }).pipe(
      map((data) => ({
        purchaseRequests: data.submitted.totalItems + data.inReview.totalItems + data.needsAdjustment.totalItems,
        purchaseOrders: data.pendingOrders.totalItems,
      })),
    );
  }).pipe(
    catchError(() => of({})),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
