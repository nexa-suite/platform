import { Injectable, inject, signal } from '@angular/core';
import { forkJoin, map } from 'rxjs';
import { SalesCommitmentApiPort } from '../../domain/ports/sales-commitment-api.port';
import { DEFAULT_PURCHASE_REQUEST_FILTERS, PurchaseRequestStatus } from '../../domain/purchase-requests/purchase-request.models';
import { DEFAULT_SALES_ORDER_FILTERS, SalesOrderStatus } from '../../domain/sales-orders/sales-order.models';
import { EMPTY_SALES_DASHBOARD, SalesDashboardState } from '../../domain/dashboard/sales-dashboard.models';

@Injectable()
export class SalesDashboardFacade {
  private readonly api = inject(SalesCommitmentApiPort);
  private readonly stateSignal = signal<SalesDashboardState>(EMPTY_SALES_DASHBOARD);
  readonly state = this.stateSignal.asReadonly();

  load(): void {
    this.stateSignal.update((state) => ({ ...state, status: 'loading', message: null }));
    forkJoin({
      submitted: this.countRequests('SUBMITTED'),
      underReview: this.countRequests('IN_REVIEW'),
      needsAdjustment: this.countRequests('NEEDS_ADJUSTMENT'),
      approved: this.countRequests('APPROVED'),
      pending: this.countOrders('PENDING'),
      confirmed: this.countOrders('CONFIRMED'),
      recentPurchaseRequests: this.api.purchaseRequests({ ...DEFAULT_PURCHASE_REQUEST_FILTERS, size: 5 }),
      recentSalesOrders: this.api.salesOrders({ ...DEFAULT_SALES_ORDER_FILTERS, size: 5 })
    }).subscribe({
      next: (data) => {
        const hasRows = data.recentPurchaseRequests.items.length > 0 || data.recentSalesOrders.items.length > 0;
        this.stateSignal.set({
          status: hasRows ? 'success' : 'empty',
          metrics: { submittedPurchaseRequests: data.submitted, purchaseRequestsUnderReview: data.underReview, purchaseRequestsNeedsAdjustment: data.needsAdjustment, approvedPurchaseRequests: data.approved, pendingSalesOrders: data.pending, confirmedSalesOrders: data.confirmed },
          recentPurchaseRequests: data.recentPurchaseRequests.items,
          recentSalesOrders: data.recentSalesOrders.items,
          message: null
        });
      },
      error: () => this.stateSignal.update((state) => ({ ...state, status: 'error', message: 'SALES_DASHBOARD_LOAD_FAILED' }))
    });
  }

  retry(): void { this.load(); }

  private countRequests(status: PurchaseRequestStatus) {
    return this.api.purchaseRequests({ ...DEFAULT_PURCHASE_REQUEST_FILTERS, status, size: 1 }).pipe(map((page) => page.totalItems));
  }

  private countOrders(status: SalesOrderStatus) {
    return this.api.salesOrders({ ...DEFAULT_SALES_ORDER_FILTERS, status, size: 1 }).pipe(map((page) => page.totalItems));
  }
}
