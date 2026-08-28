import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, map, of, scan } from 'rxjs';
import { ChangeFeedService } from '../change-feed/application/change-feed.service';
import type { ChangeEvent } from '../change-feed/domain/change-feed.models';
import { CustomerRelationshipsApiPort } from '../../customerbuyerrelationships/domain/ports/customer-relationships-api.port';
import { DEFAULT_CLIENT_ACCOUNT_FILTERS } from '../../customerbuyerrelationships/domain/client-account.models';
import { WarehouseOperationsApiPort } from '../../inventoryavailability/domain/ports/warehouse-operations-api.port';
import { LogisticsApiPort } from '../../fulfillmentdelivery/domain/ports/logistics-api.port';
import { SalesCommitmentApiPort } from '../../salescommitment/domain/ports/sales-commitment-api.port';
import { DEFAULT_PURCHASE_REQUEST_FILTERS } from '../../salescommitment/domain/purchase-requests/purchase-request.models';
import { DEFAULT_SALES_ORDER_FILTERS } from '../../salescommitment/domain/sales-orders/sales-order.models';
import { PlatformAuthenticationBoundary } from '../security/platform-authentication.boundary';
import { PLATFORM_PERMISSIONS } from '../security/platform-permissions';

export interface CompanyOwnerExecutiveOverviewSnapshot {
  readonly salesOrders: number | null;
  readonly purchaseRequests: number | null;
  readonly clientAccounts: number | null;
  readonly warehouses: number | null;
  readonly inventoryLots: number | null;
  readonly activeDispatches: number | null;
  readonly dispatchIncidents: number | null;
  readonly deliveredToday: number | null;
}

const EMPTY_SNAPSHOT: CompanyOwnerExecutiveOverviewSnapshot = {
  salesOrders: null,
  purchaseRequests: null,
  clientAccounts: null,
  warehouses: null,
  inventoryLots: null,
  activeDispatches: null,
  dispatchIncidents: null,
  deliveredToday: null,
};

/**
 * Composition boundary for the Company Owner landing.
 *
 * The owner view reads existing context ports and never assumes that the
 * owner role implies operational access. Each operational projection is
 * requested only when the current session exposes its matching permission.
 */
@Injectable({ providedIn: 'root' })
export class CompanyOwnerExecutiveOverviewFacade {
  private readonly authentication = inject(PlatformAuthenticationBoundary);
  private readonly sales = inject(SalesCommitmentApiPort);
  private readonly customers = inject(CustomerRelationshipsApiPort);
  private readonly warehouse = inject(WarehouseOperationsApiPort);
  private readonly logistics = inject(LogisticsApiPort);
  private readonly changeFeed = inject(ChangeFeedService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly snapshot = signal<CompanyOwnerExecutiveOverviewSnapshot>(EMPTY_SNAPSHOT);
  readonly activity = toSignal(
    this.changeFeed.events.pipe(
      scan(
        (events: readonly ChangeEvent[], event: ChangeEvent) => [event, ...events].slice(0, 5),
        [] as readonly ChangeEvent[],
      ),
    ),
    { initialValue: [] as readonly ChangeEvent[] },
  );

  startActivity(): void {
    this.changeFeed.connect();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const canReadSales = this.authentication.hasPermission(PLATFORM_PERMISSIONS.salesRead);
    const canReadInventory = this.authentication.hasPermission(PLATFORM_PERMISSIONS.warehouseRead);
    const canReadLogistics = this.authentication.hasPermission(PLATFORM_PERMISSIONS.logisticsRead);

    forkJoin({
      salesOrders: canReadSales
        ? this.sales.salesOrders({ ...DEFAULT_SALES_ORDER_FILTERS, size: 1 }).pipe(map((page) => page.totalItems))
        : of(null),
      purchaseRequests: canReadSales
        ? this.sales.purchaseRequests({ ...DEFAULT_PURCHASE_REQUEST_FILTERS, size: 1 }).pipe(map((page) => page.totalItems))
        : of(null),
      clientAccounts: canReadSales
        ? this.customers.clientAccounts({ ...DEFAULT_CLIENT_ACCOUNT_FILTERS, size: 1 }).pipe(map((page) => page.totalItems))
        : of(null),
      warehouses: canReadInventory
        ? this.warehouse.warehouses().pipe(map((page) => page.total))
        : of(null),
      inventoryLots: canReadInventory
        ? this.warehouse.lots().pipe(map((page) => page.total))
        : of(null),
      logistics: canReadLogistics ? this.logistics.dashboard() : of(null),
    }).subscribe({
      next: ({ salesOrders, purchaseRequests, clientAccounts, warehouses, inventoryLots, logistics }) => {
        const activeDispatches = logistics
          ? logistics.readyForOperations + logistics.preparing + logistics.assigned + logistics.scheduled + logistics.readyForRoute + logistics.inRoute
          : null;
        this.snapshot.set({
          salesOrders,
          purchaseRequests,
          clientAccounts,
          warehouses,
          inventoryLots,
          activeDispatches,
          dispatchIncidents: logistics?.incidents ?? null,
          deliveredToday: logistics?.deliveredToday ?? null,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('COMPANY_OWNER_OVERVIEW_LOAD_FAILED');
        this.loading.set(false);
      },
    });
  }

  retry(): void {
    this.load();
  }
}
