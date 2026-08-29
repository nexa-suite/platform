import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PlatformAuthenticationBoundary } from '../../core/security/platform-authentication.boundary';
import { ChangeFeedService } from '../../core/change-feed/application/change-feed.service';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/presentation/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { StatusBadgeComponent, StatusTone } from '../../shared/presentation/components/status-badge/status-badge.component';
import { ClientAccountsFacade } from '../application/client-accounts.facade';
import { ClientAccountFilters, DEFAULT_CLIENT_ACCOUNT_FILTERS } from '../domain/client-account.models';
import { downloadCsv } from '../../shared/application/utilities/export.util';

@Component({
  selector: 'nexa-client-accounts-page',
  imports: [MatPaginatorModule, RouterLink, TranslatePipe, ErrorStateComponent, LoadingStateComponent, EmptyStateComponent, PageHeaderComponent, MetricCardComponent, NexaIconComponent, StatusBadgeComponent],
  templateUrl: './client-accounts-page.component.html',
  styleUrl: './client-accounts-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAccountsPageComponent {
  readonly facade = inject(ClientAccountsFacade);
  private readonly authentication = inject(PlatformAuthenticationBoundary);
  readonly canWrite = computed(() => this.authentication.hasPermission('sales:write'));
  private readonly feed = inject(ChangeFeedService);
  readonly filters = signal<ClientAccountFilters>(DEFAULT_CLIENT_ACCOUNT_FILTERS);
  readonly accounts = computed(() => this.facade.state().page?.items ?? []);
  readonly totalAccounts = computed(() => this.facade.state().page?.totalItems ?? 0);
  readonly activeAccounts = computed(() => this.accounts().filter((account) => account.status.toUpperCase() === 'ACTIVE').length);
  readonly attentionAccounts = computed(() => this.accounts().filter((account) => account.status.toUpperCase() !== 'ACTIVE').length);

  constructor() { this.feed.connect(); this.load(); }

  searchAccounts(value: string): void { this.update({ q: value.trim(), page: 0 }); }
  applyFilters(query: string, status: string): void { this.update({ q: query.trim(), status, page: 0 }); }
  onPage(page: PageEvent): void { this.update({ page: page.pageIndex, size: page.pageSize }); }
  retry(): void { this.facade.retry(); }
  exportCsv(): void {
    downloadCsv('nexa-client-accounts.csv', this.accounts().map((account) => ({
      code: account.code,
      businessName: account.businessName,
      commercialName: account.commercialName,
      status: account.status,
      contactPerson: account.contactPerson,
      contactEmail: account.contactEmail,
      deliveryProfile: account.deliveryProfile,
      paymentCondition: account.paymentCondition,
      buyerMembershipId: account.buyerMembershipId ?? ''
    })));
  }

  statusTone(status: string): StatusTone {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'success';
      case 'SUSPENDED': return 'warning';
      case 'INACTIVE': return 'neutral';
      default: return 'info';
    }
  }

  statusLabelKey(status: string): string {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'clientAccounts.status.active';
      case 'SUSPENDED': return 'clientAccounts.status.suspended';
      case 'INACTIVE': return 'clientAccounts.status.inactive';
      default: return this.formatValue(status);
    }
  }

  paymentConditionKey(value: string): string {
    const normalized = value.trim().toUpperCase();
    return normalized ? `clientAccounts.paymentConditions.${normalized}` : 'clientAccounts.values.notConfigured';
  }

  segmentLabel(value: string): string { return this.formatValue(value); }

  relationshipLabelKey(hasBuyer: boolean): string {
    return hasBuyer ? 'clientAccounts.relationship.associated' : 'clientAccounts.relationship.notAssociated';
  }

  visibleRange(): string {
    const total = this.totalAccounts();
    if (!total) return '0';
    const page = this.filters().page;
    const size = this.filters().size;
    const start = page * size + 1;
    const end = Math.min(start + this.accounts().length - 1, total);
    return `${start}-${end}`;
  }

  private update(changes: Partial<ClientAccountFilters>): void {
    const next = { ...this.filters(), ...changes };
    this.filters.set(next);
    this.facade.load(next);
  }

  private load(): void { this.facade.load(this.filters()); }

  private formatValue(value: string): string {
    const normalized = value.trim();
    if (!normalized) return '—';
    return normalized
      .toLowerCase()
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
