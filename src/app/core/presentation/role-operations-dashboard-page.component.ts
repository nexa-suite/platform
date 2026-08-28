import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LogisticsFacade } from '../../fulfillmentdelivery/application/logistics.facade';
import { DispatchOrder } from '../../fulfillmentdelivery/domain/logistics.models';
import { formatDispatchDestination } from '../../fulfillmentdelivery/presentation/dispatch-destination.util';
import { WarehouseOperationsFacade } from '../../inventoryavailability/application/warehouse-operations.facade';
import { InventoryCatalogReference } from '../../inventoryavailability/domain/inventory-catalog-reference.models';
import { InventoryLot } from '../../inventoryavailability/domain/warehouse.models';
import { ButtonComponent } from '../../shared/presentation/components/button/button.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent, StatusTone } from '../../shared/presentation/components/status-badge/status-badge.component';
import { PlatformAuthenticationBoundary } from '../security/platform-authentication.boundary';
import { PLATFORM_PERMISSIONS } from '../security/platform-permissions';

@Component({
  selector: 'nexa-role-operations-dashboard-page',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    ErrorStateComponent,
    LoadingStateComponent,
    MetricCardComponent,
    NexaIconComponent,
    PageHeaderComponent,
    RouterLink,
    SectionPanelComponent,
    StatusBadgeComponent,
    TranslatePipe,
  ],
  templateUrl: './role-operations-dashboard-page.component.html',
  styleUrl: './role-operations-dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleOperationsDashboardPageComponent {
  private readonly auth = inject(PlatformAuthenticationBoundary);
  readonly warehouse = inject(WarehouseOperationsFacade);
  readonly delivery = inject(LogisticsFacade);
  readonly catalogItems = signal<readonly InventoryCatalogReference[]>([]);
  readonly catalogUnavailable = signal(false);

  readonly canReadInventory = computed(() =>
    this.auth.hasPermission(PLATFORM_PERMISSIONS.warehouseRead),
  );
  readonly canReadDelivery = computed(() =>
    this.auth.hasPermission(PLATFORM_PERMISSIONS.logisticsRead),
  );
  readonly isDeliveryCoordination = computed(() => {
    const user = this.auth.currentUser();
    if (user?.roles.includes('LOGISTICS')) return true;
    if (user?.roles.includes('WAREHOUSE')) return false;
    return this.canReadDelivery() && !this.canReadInventory();
  });
  readonly activeDispatches = computed(() =>
    this.delivery.dispatches().filter((item) => !['DELIVERED', 'CANCELLED'].includes(this.normalized(item.status))),
  );
  readonly pendingProof = computed(() =>
    this.delivery.proof().filter((item) => this.normalized(item.status) !== 'COMPLETED'),
  );
  readonly openIncidents = computed(() =>
    this.delivery.dispatches().filter((item) =>
      this.normalized(item.status) === 'INCIDENT' || item.alerts.length > 0,
    ),
  );
  readonly criticalLots = computed(() =>
    this.warehouse.lots().filter((item) =>
      item.available <= 0 || this.normalized(item.status) !== 'AVAILABLE',
    ),
  );
  readonly fefoLots = computed(() =>
    this.warehouse.lots()
      .filter((item) => this.normalized(item.status) === 'AVAILABLE' && this.daysUntilExpiry(item.expirationDate) >= 0 && this.daysUntilExpiry(item.expirationDate) <= 30)
      .sort((left, right) => left.expirationDate.localeCompare(right.expirationDate)),
  );

  constructor() {
    if (this.canReadInventory()) {
      this.warehouse.load();
      this.warehouse.activeCatalogItems().subscribe({ next: (items) => { this.catalogUnavailable.set(false); this.catalogItems.set(items); }, error: () => this.catalogUnavailable.set(true) });
    }
    if (this.canReadDelivery()) {
      this.delivery.loadDashboard();
      this.delivery.load();
      this.delivery.loadProof();
    }
  }

  productName(lot: InventoryLot): string {
    return this.catalogItems().find((item) => item.catalogItemId === lot.catalogItemId || item.id === lot.catalogItemId)?.name ?? lot.catalogItemId;
  }

  dispatchTone(item: DispatchOrder): StatusTone {
    const status = this.normalized(item.status);
    if (status === 'INCIDENT') return 'danger';
    if (status === 'IN_ROUTE') return 'info';
    if (status === 'DELIVERED') return 'success';
    return 'warning';
  }

  destinationLabel(item: DispatchOrder): string {
    return formatDispatchDestination(item);
  }

  statusKey(value: string): string {
    return `logistics.status.${value}`;
  }

  etaLabel(item: DispatchOrder): string {
    return item.eta ? item.eta : 'operationsDashboard.notScheduled';
  }

  daysUntilExpiry(value: string): number {
    const expiry = new Date(value).getTime();
    if (!Number.isFinite(expiry)) return Number.POSITIVE_INFINITY;
    return Math.ceil((expiry - Date.now()) / 86_400_000);
  }

  private normalized(value: string): string {
    return value.trim().toUpperCase();
  }
}
