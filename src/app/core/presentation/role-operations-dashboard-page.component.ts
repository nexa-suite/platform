import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthenticationService } from '../../iam/application/authentication.service';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { WarehouseOperationsFacade } from '../../warehouse/application/warehouse-operations.facade';
import { LogisticsFacade } from '../../logistics/application/logistics.facade';

@Component({
  selector: 'nexa-role-operations-dashboard-page',
  standalone: true,
  imports: [RouterLink, MetricCardComponent, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent],
  template: `<section class="page">
    @if (isLogistics()) {
      <nexa-page-header title="Operations Dashboard" subtitle="Dispatch metrics from the Logistics bounded context" />
      @if (logistics.loading()) { <nexa-loading-state /> }
      @else if (logistics.dashboard(); as data) {
        <div class="metric-grid"><nexa-metric-card label="Ready" [value]="data.readyForOperations" /><nexa-metric-card label="In route" [value]="data.inRoute" /><nexa-metric-card label="Incidents" [value]="data.incidents" /><nexa-metric-card label="Delivered today" [value]="data.deliveredToday" /></div>
        <nexa-section-panel title="Logistics actions"><a routerLink="/ops/operations/dispatch-orders">Dispatch Board</a> · <a routerLink="/ops/operations/proof-of-delivery">POD queue</a></nexa-section-panel>
      }
    } @else {
      <nexa-page-header title="Operations Dashboard" subtitle="Warehouse and fulfillment control" />
      @if (warehouse.loading()) { <nexa-loading-state /> }
      @else {
        <div class="metric-grid"><nexa-metric-card label="Warehouses" [value]="warehouse.metrics().warehouses" /><nexa-metric-card label="Available lots" [value]="warehouse.metrics().available" /><nexa-metric-card label="Reserved orders" [value]="warehouse.metrics().reserved" /><nexa-metric-card label="Shortages" [value]="warehouse.metrics().shortages" /></div>
        <nexa-section-panel title="Warehouse actions"><a routerLink="/ops/operations/warehouses">Warehouses and Zones</a> · <a routerLink="/ops/operations/inventory/lots">Inventory Lots</a></nexa-section-panel>
      }
    }
  </section>`,
  styles: [`.metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem;margin-bottom:1rem}a{color:inherit}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleOperationsDashboardPageComponent {
  private readonly auth = inject(AuthenticationService);
  readonly warehouse = inject(WarehouseOperationsFacade);
  readonly logistics = inject(LogisticsFacade);
  readonly isLogistics = computed(() => this.auth.currentUser()?.roles.includes('LOGISTICS') ?? false);
  constructor() { if (this.isLogistics()) this.logistics.loadDashboard(); else this.warehouse.load(); }
}
