import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LogisticsFacade } from '../../fulfillmentdelivery/application/logistics.facade';
import { DispatchOrder } from '../../fulfillmentdelivery/domain/logistics.models';
import { formatDispatchDestination } from '../../fulfillmentdelivery/presentation/dispatch-destination.util';
import { WarehouseOperationsFacade } from '../../inventoryavailability/application/warehouse-operations.facade';
import { ButtonComponent } from '../../shared/presentation/components/button/button.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent, StatusTone } from '../../shared/presentation/components/status-badge/status-badge.component';
import { PlatformAuthenticationBoundary } from '../security/platform-authentication.boundary';
import { platformOperationalRoleForUser, PlatformOperationalRole } from '../security/platform-permissions';

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
  readonly operationalRole = computed<PlatformOperationalRole | null>(() =>
    platformOperationalRoleForUser(this.auth.currentUser(), this.auth.hasPermission),
  );
  readonly isDeliveryCoordination = computed(() => this.operationalRole() === 'LOGISTICS');
  readonly isWarehouseOperations = computed(() => this.operationalRole() === 'WAREHOUSE');
  readonly warehouseHasPartialData = computed(() => Object.values(this.warehouse.sourceErrors()).some(Boolean));
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
  constructor() {
    if (this.isWarehouseOperations()) {
      this.warehouse.load();
    }
    if (this.isDeliveryCoordination()) {
      this.delivery.loadDashboard();
      this.delivery.load();
      this.delivery.loadProof();
    }
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

  retryDelivery(): void {
    if (this.delivery.dashboardError()) this.delivery.loadDashboard();
    if (this.delivery.dispatchesError()) this.delivery.load();
    if (this.delivery.proofError()) this.delivery.loadProof();
  }

  private normalized(value: string): string {
    return value.trim().toUpperCase();
  }
}
