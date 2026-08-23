import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { AuthenticationService } from '../../../iam/application/authentication.service';
import { ChangeFeedService } from '../../../core/change-feed/infrastructure/change-feed.service';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/presentation/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { ClientAccountsFacade } from '../application/client-accounts.facade';
import { ClientAccountFilters, DEFAULT_CLIENT_ACCOUNT_FILTERS } from '../domain/client-account.models';
import { downloadCsv } from '../../../shared/application/utilities/export.util';

@Component({
  selector: 'nexa-client-accounts-page',
  imports: [MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatPaginatorModule, MatSelectModule, MatSortModule, RouterLink, TranslatePipe, ErrorStateComponent, LoadingStateComponent, EmptyStateComponent, PageHeaderComponent],
  templateUrl: './client-accounts-page.component.html',
  styleUrl: './client-accounts-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAccountsPageComponent {
  readonly facade = inject(ClientAccountsFacade);
  private readonly authentication = inject(AuthenticationService);
  readonly canWrite = computed(() => this.authentication.hasPermission('sales:write'));
  private readonly feed = inject(ChangeFeedService);
  readonly filters = signal<ClientAccountFilters>(DEFAULT_CLIENT_ACCOUNT_FILTERS);

  constructor() { this.feed.connect(); this.load(); }

  searchAccounts(value: string): void { this.update({ q: value.trim(), page: 0 }); }
  filterStatus(status: string): void { this.update({ status, page: 0 }); }
  onSort(sort: Sort): void {
    const allowed = ['code', 'businessName', 'commercialName', 'status', 'createdAt'] as const;
    if (!allowed.includes(sort.active as typeof allowed[number])) return;
    this.update({ sort: sort.active as ClientAccountFilters['sort'], direction: sort.direction === 'desc' ? 'desc' : 'asc', page: 0 });
  }
  onPage(page: PageEvent): void { this.update({ page: page.pageIndex, size: page.pageSize }); }
  retry(): void { this.facade.retry(); }
  exportCsv(): void {
    const items = this.facade.state().page?.items ?? [];
    downloadCsv('nexa-client-accounts.csv', items.map((account) => ({ code: account.code, businessName: account.businessName, commercialName: account.commercialName, status: account.status, contactEmail: account.contactEmail, deliveryProfile: account.deliveryProfile })));
  }

  private update(changes: Partial<ClientAccountFilters>): void {
    const next = { ...this.filters(), ...changes };
    this.filters.set(next);
    this.facade.load(next);
  }

  private load(): void { this.facade.load(this.filters()); }
}
