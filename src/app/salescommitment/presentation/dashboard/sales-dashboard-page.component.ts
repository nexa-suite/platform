import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../../shared/presentation/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { ChangeFeedService } from '../../../core/change-feed/application/change-feed.service';
import { ChangeEvent } from '../../../core/change-feed/domain/change-feed.models';
import { SalesDashboardFacade } from '../../application/dashboard/sales-dashboard.facade';
import { DEFAULT_SALES_COMMITMENT_CUSTOMER_FILTERS } from '../../domain/customer-reference.models';
import { SalesCommitmentCustomerPort } from '../../domain/ports/sales-commitment-cross-context.ports';
import { SalesDashboardBusinessDocument, SalesDashboardSupportingDataPort } from '../../domain/ports/sales-dashboard-supporting-data.port';

@Component({
  selector: 'nexa-sales-dashboard-page',
  standalone: true,
  providers: [SalesDashboardFacade],
  imports: [RouterLink, TranslatePipe, ErrorStateComponent, EmptyStateComponent, LoadingStateComponent, NexaIconComponent],
  templateUrl: './sales-dashboard-page.component.html',
  styleUrl: './sales-dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesDashboardPageComponent {
  readonly facade = inject(SalesDashboardFacade);
  private readonly supportingData = inject(SalesDashboardSupportingDataPort);
  private readonly changeFeed = inject(ChangeFeedService);
  private readonly customersApi = inject(SalesCommitmentCustomerPort);
  private readonly destroyRef = inject(DestroyRef);
  readonly documents = signal<readonly SalesDashboardBusinessDocument[]>([]);
  readonly activityEvents = signal<readonly ChangeEvent[]>([]);
  readonly clientNames = signal<ReadonlyMap<string, string>>(new Map());

  readonly newRequestCount = computed(() => {
    const metrics = this.facade.state().metrics;
    return metrics.submittedPurchaseRequests + metrics.purchaseRequestsUnderReview + metrics.purchaseRequestsNeedsAdjustment;
  });
  readonly requestPreview = computed(() => {
    const requests = this.facade.state().recentPurchaseRequests;
    const active = requests.filter((request) => ['SUBMITTED', 'IN_REVIEW', 'NEEDS_ADJUSTMENT'].includes(request.status));
    return (active.length ? active : requests).slice(0, 5);
  });
  readonly pendingDocuments = computed(() => this.documents().filter((document) => ['PENDING', 'GENERATING', 'OBSERVED', 'FAILED', 'REJECTED'].includes(document.status.toUpperCase())).slice(0, 6));
  readonly pendingDocumentCount = computed(() => this.pendingDocuments().length);
  readonly pendingCreditRequestCount = signal(0);
  readonly blockedOrderCount = signal(0);
  readonly activityPreview = computed(() => this.activityEvents().slice(0, 7));

  constructor() {
    this.facade.load();
    this.supportingData.pendingBusinessDocuments().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (documents) => this.documents.set(documents),
      error: () => this.documents.set([]),
    });
    this.customersApi.clientAccounts({ ...DEFAULT_SALES_COMMITMENT_CUSTOMER_FILTERS, size: 50 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => this.clientNames.set(new Map(page.items.map((client) => [client.id, client.businessName]))),
      error: () => this.clientNames.set(new Map()),
    });
    this.changeFeed.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      this.activityEvents.update((current) => [event, ...current.filter((item) => item.id !== event.id)].slice(0, 7));
    });
    this.changeFeed.connect();
  }

  requestBadge(status: string): string {
    if (status === 'APPROVED' || status === 'CONVERTED_TO_ORDER') return 'badge-green';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'badge-red';
    if (status === 'DRAFT' || status === 'NEEDS_ADJUSTMENT') return 'badge-amber';
    return 'badge-blue';
  }

  requestStatusLabel(status: string): string {
    return status.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  }

  requestPriority(priority: string): string {
    if (priority === 'URGENT') return 'priority-urgent';
    if (priority === 'HIGH') return 'priority-high';
    return 'priority-medium';
  }

  documentLabel(document: SalesDashboardBusinessDocument): string {
    return document.documentType.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }

  clientName(clientAccountId: string): string {
    return this.clientNames().get(clientAccountId) ?? clientAccountId;
  }

  documentStatusLabel(status: string): string {
    return status.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  }

  documentBadge(status: string): string {
    const normalized = status.toUpperCase();
    if (normalized === 'FAILED' || normalized === 'REJECTED') return 'badge-red';
    if (normalized === 'GENERATING' || normalized === 'OBSERVED') return 'badge-amber';
    return 'badge-blue';
  }

  eventSummary(event: ChangeEvent): string {
    return [event.eventType, event.resourceType].filter(Boolean).join(' · ') || 'Workspace activity';
  }

  eventTime(event: ChangeEvent): string {
    if (!event.occurredAt) return '—';
    const date = new Date(event.occurredAt);
    return Number.isNaN(date.getTime()) ? event.occurredAt : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }
}
