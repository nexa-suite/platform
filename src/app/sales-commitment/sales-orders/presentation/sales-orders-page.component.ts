import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ChangeFeedService } from '../../../core/change-feed/infrastructure/change-feed.service';
import { EmptyStateComponent } from '../../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SalesOrdersFacade } from '../application/sales-orders.facade';
import { DEFAULT_SALES_ORDER_FILTERS, SalesOrderFilters, SalesOrderStatus } from '../domain/sales-order.models';
import { downloadCsv, printCurrentView } from '../../../shared/application/utilities/export.util';

@Component({ selector: 'nexa-sales-orders-page', imports: [DecimalPipe, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatPaginatorModule, MatSelectModule, MatSortModule, RouterLink, TranslatePipe, ErrorStateComponent, LoadingStateComponent, EmptyStateComponent, PageHeaderComponent], templateUrl: './sales-orders-page.component.html', styleUrl: './sales-orders-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class SalesOrdersPageComponent {
  readonly facade = inject(SalesOrdersFacade);
  private readonly feed = inject(ChangeFeedService);
  readonly filters = signal<SalesOrderFilters>(DEFAULT_SALES_ORDER_FILTERS);
  constructor() { this.feed.connect(); this.facade.load(this.filters()); }
  filterStatus(status: string): void { this.update({ status: status as SalesOrderStatus | '', page: 0 }); }
  search(q: string): void { this.update({ q: q.trim(), page: 0 }); }
  onSort(sort: Sort): void { const allowed = ['orderNumber', 'createdAt', 'updatedAt', 'priority', 'total', 'requestedDeliveryDate'] as const; if (allowed.includes(sort.active as typeof allowed[number])) this.update({ sort: sort.active as SalesOrderFilters['sort'], direction: sort.direction === 'asc' ? 'asc' : 'desc', page: 0 }); }
  onPage(page: PageEvent): void { this.update({ page: page.pageIndex, size: page.pageSize }); }
  retry(): void { this.facade.retry(); }
  exportCsv(): void { downloadCsv('nexa-sales-orders.csv', (this.facade.state().page?.items ?? []).map((order) => ({ number: order.number, client: order.clientAccountName || order.clientAccountId, status: order.status, total: order.total, currency: order.currency, purchaseRequest: order.purchaseRequestId }))); }
  print(): void { printCurrentView(); }
  private update(changes: Partial<SalesOrderFilters>): void { const next = { ...this.filters(), ...changes }; this.filters.set(next); this.facade.load(next); }
}
