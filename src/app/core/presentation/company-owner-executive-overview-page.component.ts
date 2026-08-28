import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { CompanyOwnerExecutiveOverviewFacade, CompanyOwnerExecutiveOverviewSnapshot } from './company-owner-executive-overview.facade';
import { EmptyStateComponent } from '../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent, MetricTone } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';

type OwnerMetricKey = keyof CompanyOwnerExecutiveOverviewSnapshot;

interface OwnerMetricDefinition {
  readonly key: OwnerMetricKey;
  readonly label: string;
  readonly hint: string;
  readonly icon: string;
  readonly tone: MetricTone;
}

/** Company Owner read-only landing backed by authorized server projections. */
@Component({
  selector: 'nexa-company-owner-executive-overview',
  imports: [
    DatePipe,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    MetricCardComponent,
    NexaIconComponent,
    PageHeaderComponent,
    SectionPanelComponent,
    TranslatePipe,
  ],
  templateUrl: './company-owner-executive-overview-page.component.html',
  styleUrl: './company-owner-executive-overview-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyOwnerExecutiveOverviewPageComponent {
  readonly facade = inject(CompanyOwnerExecutiveOverviewFacade);
  readonly metrics: readonly OwnerMetricDefinition[] = [
    { key: 'salesOrders', label: 'companyOwnerOverview.metrics.salesOrders', hint: 'companyOwnerOverview.hints.salesOrders', icon: 'receipt_long', tone: 'info' },
    { key: 'purchaseRequests', label: 'companyOwnerOverview.metrics.purchaseRequests', hint: 'companyOwnerOverview.hints.purchaseRequests', icon: 'request_quote', tone: 'neutral' },
    { key: 'clientAccounts', label: 'companyOwnerOverview.metrics.clientAccounts', hint: 'companyOwnerOverview.hints.clientAccounts', icon: 'groups', tone: 'neutral' },
    { key: 'warehouses', label: 'companyOwnerOverview.metrics.warehouses', hint: 'companyOwnerOverview.hints.warehouses', icon: 'warehouse', tone: 'success' },
    { key: 'inventoryLots', label: 'companyOwnerOverview.metrics.inventoryLots', hint: 'companyOwnerOverview.hints.inventoryLots', icon: 'inventory_2', tone: 'warning' },
    { key: 'activeDispatches', label: 'companyOwnerOverview.metrics.activeDispatches', hint: 'companyOwnerOverview.hints.activeDispatches', icon: 'local_shipping', tone: 'info' },
    { key: 'dispatchIncidents', label: 'companyOwnerOverview.metrics.dispatchIncidents', hint: 'companyOwnerOverview.hints.dispatchIncidents', icon: 'report_problem', tone: 'danger' },
    { key: 'deliveredToday', label: 'companyOwnerOverview.metrics.deliveredToday', hint: 'companyOwnerOverview.hints.deliveredToday', icon: 'task_alt', tone: 'success' },
  ];

  constructor() {
    this.facade.startActivity();
    this.facade.load();
  }

  metricValue(key: OwnerMetricKey): number | string {
    return this.facade.snapshot()[key] ?? '—';
  }

  metricHint(metric: OwnerMetricDefinition): string {
    return this.facade.snapshot()[metric.key] === null
      ? 'companyOwnerOverview.accessNotGranted'
      : metric.hint;
  }

  eventLabel(event: { readonly eventType: string; readonly resourceType: string; readonly resourceId: string | null }): string {
    return [event.eventType, event.resourceType, event.resourceId].filter(Boolean).join(' · ');
  }
}
