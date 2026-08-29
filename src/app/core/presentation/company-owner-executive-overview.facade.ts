import { computed, Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, Observable, of, scan } from 'rxjs';
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

export type CompanyOwnerOverviewProjection =
  | 'salesOrders'
  | 'purchaseRequests'
  | 'clientAccounts'
  | 'warehouses'
  | 'inventoryLots'
  | 'logistics';

export type CompanyOwnerOverviewProjectionState = 'ready' | 'notGranted' | 'failed';

type CompanyOwnerOverviewProjectionStates = Record<CompanyOwnerOverviewProjection, CompanyOwnerOverviewProjectionState>;

interface CompanyOwnerOverviewProjectionResult {
  readonly projection: CompanyOwnerOverviewProjection;
  readonly state: CompanyOwnerOverviewProjectionState;
  readonly snapshot: Partial<CompanyOwnerExecutiveOverviewSnapshot>;
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

const ALL_PROJECTIONS: readonly CompanyOwnerOverviewProjection[] = [
  'salesOrders',
  'purchaseRequests',
  'clientAccounts',
  'warehouses',
  'inventoryLots',
  'logistics',
];

const INITIAL_PROJECTION_STATES: CompanyOwnerOverviewProjectionStates = {
  salesOrders: 'notGranted',
  purchaseRequests: 'notGranted',
  clientAccounts: 'notGranted',
  warehouses: 'notGranted',
  inventoryLots: 'notGranted',
  logistics: 'notGranted',
};

const NOT_GRANTED_SNAPSHOT: Record<CompanyOwnerOverviewProjection, Partial<CompanyOwnerExecutiveOverviewSnapshot>> = {
  salesOrders: { salesOrders: null },
  purchaseRequests: { purchaseRequests: null },
  clientAccounts: { clientAccounts: null },
  warehouses: { warehouses: null },
  inventoryLots: { inventoryLots: null },
  logistics: { activeDispatches: null, dispatchIncidents: null, deliveredToday: null },
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
  readonly hasLoaded = signal(false);
  readonly snapshot = signal<CompanyOwnerExecutiveOverviewSnapshot>(EMPTY_SNAPSHOT);
  readonly projectionStates = signal<CompanyOwnerOverviewProjectionStates>(INITIAL_PROJECTION_STATES);
  readonly failedSources = computed(() => ALL_PROJECTIONS.filter((projection) => this.projectionStates()[projection] === 'failed'));
  readonly hasFailures = computed(() => this.failedSources().length > 0);
  readonly error = computed(() => this.hasFailures() ? 'COMPANY_OWNER_OVERVIEW_PARTIAL_LOAD_FAILED' : null);
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
    this.loadProjections(ALL_PROJECTIONS);
  }

  retry(): void {
    this.load();
  }

  retryFailed(): void {
    this.loadProjections(this.failedSources());
  }

  projectionState(projection: CompanyOwnerOverviewProjection): CompanyOwnerOverviewProjectionState {
    return this.projectionStates()[projection];
  }

  private loadProjections(projections: readonly CompanyOwnerOverviewProjection[]): void {
    if (!projections.length) return;

    this.loading.set(true);

    const canReadSales = this.authentication.hasPermission(PLATFORM_PERMISSIONS.salesRead);
    const canReadInventory = this.authentication.hasPermission(PLATFORM_PERMISSIONS.warehouseRead);
    const canReadLogistics = this.authentication.hasPermission(PLATFORM_PERMISSIONS.logisticsRead);

    forkJoin(projections.map((projection) => this.requestProjection(projection, {
      canReadSales,
      canReadInventory,
      canReadLogistics,
    }))).subscribe({
      next: (results) => {
        this.snapshot.update((current) => results.reduce(
          (snapshot, result) => ({ ...snapshot, ...result.snapshot }),
          current,
        ));
        this.projectionStates.update((current) => results.reduce(
          (states, result) => ({ ...states, [result.projection]: result.state }),
          current,
        ));
        this.hasLoaded.set(true);
        this.loading.set(false);
      },
    });
  }

  private requestProjection(
    projection: CompanyOwnerOverviewProjection,
    permissions: { readonly canReadSales: boolean; readonly canReadInventory: boolean; readonly canReadLogistics: boolean },
  ) {
    switch (projection) {
      case 'salesOrders':
        return this.request(
          projection,
          permissions.canReadSales,
          () => this.sales.salesOrders({ ...DEFAULT_SALES_ORDER_FILTERS, size: 1 }).pipe(map((page) => ({ salesOrders: page.totalItems }))),
        );
      case 'purchaseRequests':
        return this.request(
          projection,
          permissions.canReadSales,
          () => this.sales.purchaseRequests({ ...DEFAULT_PURCHASE_REQUEST_FILTERS, size: 1 }).pipe(map((page) => ({ purchaseRequests: page.totalItems }))),
        );
      case 'clientAccounts':
        return this.request(
          projection,
          permissions.canReadSales,
          () => this.customers.clientAccounts({ ...DEFAULT_CLIENT_ACCOUNT_FILTERS, size: 1 }).pipe(map((page) => ({ clientAccounts: page.totalItems }))),
        );
      case 'warehouses':
        return this.request(
          projection,
          permissions.canReadInventory,
          () => this.warehouse.warehouses().pipe(map((page) => ({ warehouses: page.total }))),
        );
      case 'inventoryLots':
        return this.request(
          projection,
          permissions.canReadInventory,
          () => this.warehouse.lots().pipe(map((page) => ({ inventoryLots: page.total }))),
        );
      case 'logistics':
        return this.request(
          projection,
          permissions.canReadLogistics,
          () => this.logistics.dashboard().pipe(map((dashboard) => ({
            activeDispatches: dashboard.readyForOperations + dashboard.preparing + dashboard.assigned + dashboard.scheduled + dashboard.readyForRoute + dashboard.inRoute,
            dispatchIncidents: dashboard.incidents,
            deliveredToday: dashboard.deliveredToday,
          }))),
        );
    }
  }

  private request(
    projection: CompanyOwnerOverviewProjection,
    authorized: boolean,
    request: () => Observable<Partial<CompanyOwnerExecutiveOverviewSnapshot>>,
  ) {
    if (!authorized) {
      return of<CompanyOwnerOverviewProjectionResult>({
        projection,
        state: 'notGranted',
        snapshot: NOT_GRANTED_SNAPSHOT[projection],
      });
    }

    return request().pipe(
      map((snapshot) => ({ projection, state: 'ready' as const, snapshot })),
      catchError(() => of<CompanyOwnerOverviewProjectionResult>({
        projection,
        state: 'failed',
        snapshot: NOT_GRANTED_SNAPSHOT[projection],
      })),
    );
  }
}
