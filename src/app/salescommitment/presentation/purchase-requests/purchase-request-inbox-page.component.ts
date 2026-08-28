import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { ChangeFeedService } from '../../../core/change-feed/application/change-feed.service';
import { LanguageService } from '../../../core/i18n/language.service';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PurchaseRequestOperationsFacade } from '../../application/purchase-requests/purchase-request-operations.facade';
import { DEFAULT_SALES_COMMITMENT_CUSTOMER_FILTERS } from '../../domain/customer-reference.models';
import { SalesCommitmentCustomerPort } from '../../domain/ports/sales-commitment-cross-context.ports';
import { PurchaseRequest, PurchaseRequestPriority, PurchaseRequestStatus } from '../../domain/purchase-requests/purchase-request.models';

@Component({
  selector: 'nexa-purchase-request-inbox-page',
  imports: [RouterLink, TranslatePipe, ErrorStateComponent, LoadingStateComponent, NexaIconComponent],
  templateUrl: './purchase-request-inbox-page.component.html',
  styleUrl: './purchase-request-inbox-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeQuickView()' }
})
export class PurchaseRequestInboxPageComponent {
  readonly facade = inject(PurchaseRequestOperationsFacade);
  private readonly feed = inject(ChangeFeedService);
  private readonly languageService = inject(LanguageService);
  private readonly customers = inject(SalesCommitmentCustomerPort);
  private readonly destroyRef = inject(DestroyRef);
  readonly clientNames = signal<ReadonlyMap<string, string>>(new Map());
  readonly selectedRequest = signal<PurchaseRequest | null>(null);

  constructor() {
    this.feed.connect();
    this.facade.load();
    this.customers.clientAccounts({ ...DEFAULT_SALES_COMMITMENT_CUSTOMER_FILTERS, size: 100 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => this.clientNames.set(new Map(page.items.map((client) => [client.id, client.commercialName || client.businessName || client.code]))),
      error: () => this.clientNames.set(new Map())
    });
  }

  retry(): void { this.facade.retry(); }

  openQuickView(request: PurchaseRequest): void { this.selectedRequest.set(request); }

  closeQuickView(): void { this.selectedRequest.set(null); }

  displayCode(request: PurchaseRequest): string { return request.code || request.id; }

  clientName(clientAccountId: string): string { return this.clientNames().get(clientAccountId) ?? clientAccountId; }

  requestBadge(status: PurchaseRequestStatus): string {
    if (status === 'APPROVED' || status === 'CONVERTED_TO_ORDER') return 'badge-green';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'badge-red';
    if (status === 'DRAFT' || status === 'NEEDS_ADJUSTMENT') return 'badge-amber';
    return 'badge-blue';
  }

  requestStatusLabel(status: PurchaseRequestStatus): string {
    return status.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  }

  requestPriorityLabel(priority: PurchaseRequestPriority): string {
    return priority === 'URGENT' ? 'URGENT' : priority.toLowerCase();
  }

  priorityBadge(priority: PurchaseRequestPriority): string {
    if (priority === 'URGENT') return 'badge-red';
    return priority === 'HIGH' ? 'badge-blue' : 'badge-gray';
  }

  canRespond(request: PurchaseRequest): boolean {
    return !['APPROVED', 'REJECTED', 'CANCELLED', 'CONVERTED_TO_ORDER'].includes(request.status);
  }

  docsFor(): readonly string[] { return ['factura_xml', 'factura_pdf', 'guia_pdf']; }

  formatDate(value: string | null): string {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    const locale = this.languageService.currentLanguage() === 'es' ? 'es-PE' : 'en-US';
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
  }

  linePrice(line: PurchaseRequest['lines'][number]): string {
    if (line.unitPriceAmount === null || !line.unitPriceCurrency) return '—';
    const amount = line.unitPriceAmount.toFixed(2);
    return line.unitPriceCurrency === 'PEN' ? `S/ ${amount}` : `${line.unitPriceCurrency} ${amount}`;
  }
}
