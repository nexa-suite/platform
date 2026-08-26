import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
import { ChangeFeedService } from '../../../core/change-feed/application/change-feed.service';
import { EmptyStateComponent } from '../../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { PurchaseRequestOperationsFacade } from '../../application/purchase-requests/purchase-request-operations.facade';
import { DEFAULT_PURCHASE_REQUEST_FILTERS, PurchaseRequestFilters, PurchaseRequestPriority, PurchaseRequestStatus } from '../../domain/purchase-requests/purchase-request.models';
import { downloadCsv, printCurrentView } from '../../../shared/application/utilities/export.util';

@Component({ selector: 'nexa-purchase-request-inbox-page', imports: [MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatPaginatorModule, MatSelectModule, MatSortModule, RouterLink, TranslatePipe, ErrorStateComponent, LoadingStateComponent, EmptyStateComponent, PageHeaderComponent], templateUrl: './purchase-request-inbox-page.component.html', styleUrl: './purchase-request-inbox-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class PurchaseRequestInboxPageComponent {
  readonly facade = inject(PurchaseRequestOperationsFacade);
  private readonly feed = inject(ChangeFeedService);
  readonly filters = signal<PurchaseRequestFilters>(DEFAULT_PURCHASE_REQUEST_FILTERS);

  constructor() { this.feed.connect(); this.facade.load(this.filters()); }
  filterStatus(status: string): void { this.update({ status: status as PurchaseRequestStatus | '', page: 0 }); }
  filterPriority(priority: string): void { this.update({ priority: priority as PurchaseRequestPriority | '', page: 0 }); }
  search(value: string): void { this.update({ q: value.trim(), page: 0 }); }
  onSort(sort: Sort): void { const allowed = ['createdAt', 'updatedAt'] as const; if (allowed.includes(sort.active as typeof allowed[number])) this.update({ sort: sort.active as PurchaseRequestFilters['sort'], direction: sort.direction === 'asc' ? 'asc' : 'desc', page: 0 }); }
  onPage(page: PageEvent): void { this.update({ page: page.pageIndex, size: page.pageSize }); }
  retry(): void { this.facade.retry(); }
  exportCsv(): void { downloadCsv('nexa-purchase-requests.csv', (this.facade.state().page?.items ?? []).map((request) => ({ code: request.code, client: request.clientAccountId, status: request.status, priority: request.priority, deliveryDate: request.requestedDeliveryDate ?? '', lines: request.lineCount }))); }
  print(): void { printCurrentView(); }
  private update(changes: Partial<PurchaseRequestFilters>): void { const next = { ...this.filters(), ...changes }; this.filters.set(next); this.facade.load(next); }
}
