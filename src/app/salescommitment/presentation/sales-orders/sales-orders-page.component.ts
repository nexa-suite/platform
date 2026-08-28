import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ChangeFeedService } from '../../../core/change-feed/application/change-feed.service';
import { ButtonComponent } from '../../../shared/presentation/components/button/button.component';
import { EmptyStateComponent } from '../../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent, StatusTone } from '../../../shared/presentation/components/status-badge/status-badge.component';
import { SalesOrdersFacade } from '../../application/sales-orders/sales-orders.facade';
import { DEFAULT_SALES_ORDER_FILTERS, SalesOrderFilters, SalesOrderStatus } from '../../domain/sales-orders/sales-order.models';
import { downloadCsv, printCurrentView } from '../../../shared/application/utilities/export.util';

@Component({ selector: 'nexa-sales-orders-page', imports: [DecimalPipe, MatPaginatorModule, RouterLink, TranslatePipe, ButtonComponent, ErrorStateComponent, LoadingStateComponent, EmptyStateComponent, MetricCardComponent, NexaIconComponent, PageHeaderComponent, SectionPanelComponent, StatusBadgeComponent], templateUrl: './sales-orders-page.component.html', styleUrl: './sales-orders-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class SalesOrdersPageComponent {
  readonly facade = inject(SalesOrdersFacade);
  private readonly feed = inject(ChangeFeedService);
  readonly filters = signal<SalesOrderFilters>(DEFAULT_SALES_ORDER_FILTERS);
  readonly summary = computed(() => {
    const items = this.facade.state().page?.items ?? [];
    return {
      total: items.length,
      pending: items.filter((order) => order.status === 'PENDING').length,
      confirmed: items.filter((order) => order.status === 'CONFIRMED').length,
      amount: items.reduce((total, order) => total + order.total, 0),
      currency: items[0]?.currency ?? 'PEN',
    };
  });
  constructor() { this.feed.connect(); this.facade.load(this.filters()); }
  filterStatus(status: string): void { this.update({ status: status as SalesOrderStatus | '', page: 0 }); }
  search(q: string): void { this.update({ q: q.trim(), page: 0 }); }
  sortBy(field: SalesOrderFilters['sort']): void { const current = this.filters(); this.update({ sort: field, direction: current.sort === field && current.direction === 'desc' ? 'asc' : 'desc', page: 0 }); }
  onPage(page: PageEvent): void { this.update({ page: page.pageIndex, size: page.pageSize }); }
  retry(): void { this.facade.retry(); }
  exportCsv(): void { downloadCsv('nexa-sales-orders.csv', (this.facade.state().page?.items ?? []).map((order) => ({ number: order.number, client: order.clientAccountName || order.clientAccountId, status: order.status, total: order.total, currency: order.currency, purchaseRequest: order.purchaseRequestId }))); }
  print(): void { printCurrentView(); }
  statusTone(status: SalesOrderStatus): StatusTone {
    if (status === 'CONFIRMED') return 'success';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'danger';
    return 'warning';
  }
  priorityTone(priority: 'NORMAL' | 'HIGH' | 'URGENT'): StatusTone { return priority === 'URGENT' ? 'danger' : priority === 'HIGH' ? 'warning' : 'neutral'; }
  private update(changes: Partial<SalesOrderFilters>): void { const next = { ...this.filters(), ...changes }; this.filters.set(next); this.facade.load(next); }
}
