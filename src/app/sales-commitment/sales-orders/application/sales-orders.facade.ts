import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeFeedService } from '../../../core/change-feed/infrastructure/change-feed.service';
import { SalesCommitmentApiService } from '../../infrastructure/http/sales-commitment-api.service';
import { DEFAULT_SALES_ORDER_FILTERS, SalesOrderFilters, SalesOrderState } from '../domain/sales-order.models';

@Injectable()
export class SalesOrdersFacade {
  private readonly api = inject(SalesCommitmentApiService);
  private readonly feed = inject(ChangeFeedService, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly stateSignal = signal<SalesOrderState>({ status: 'idle', page: null, item: null, events: [], candidates: [], message: null });
  private lastFilters: SalesOrderFilters = DEFAULT_SALES_ORDER_FILTERS;
  private lastId: string | null = null;
  private candidatesMode = false;

  readonly state = this.stateSignal.asReadonly();

  constructor() {
    this.feed?.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event.eventType === 'resync-required' || /sales[-_]?order|purchase[-_]?request/i.test(event.resourceType)) {
        if (this.candidatesMode) this.loadCandidates();
        else if (this.lastId) this.loadDetail(this.lastId);
        else this.load(this.lastFilters);
      }
    });
  }

  load(filters: SalesOrderFilters = DEFAULT_SALES_ORDER_FILTERS): void {
    this.lastFilters = filters;
    this.lastId = null;
    this.candidatesMode = false;
    const hasItems = (this.stateSignal().page?.items.length ?? 0) > 0;
    this.stateSignal.update((state) => ({ ...state, status: hasItems ? 'retrying' : 'loading', message: null }));
    this.api.salesOrders(filters).subscribe({
      next: (page) => this.stateSignal.set({ status: page.items.length ? 'success' : 'empty', page, item: null, events: [], candidates: [], message: null }),
      error: () => this.stateSignal.update((state) => ({ ...state, status: 'error', message: 'SALES_ORDERS_LOAD_FAILED' }))
    });
  }

  loadDetail(id: string): void {
    this.lastId = id;
    this.candidatesMode = false;
    const hasItem = this.stateSignal().item !== null;
    this.stateSignal.update((state) => ({ ...state, status: hasItem ? 'retrying' : 'loading', message: null }));
    this.api.salesOrder(id).subscribe({
      next: (item) => this.stateSignal.update((state) => ({ ...state, status: 'success', item, page: null, message: null })),
      error: () => this.stateSignal.update((state) => ({ ...state, status: 'error', message: 'SALES_ORDER_LOAD_FAILED' }))
    });
    this.api.salesOrderEvents(id).subscribe({
      next: (events) => this.stateSignal.update((state) => ({ ...state, events })),
      error: () => this.stateSignal.update((state) => ({ ...state, message: 'SALES_ORDER_TIMELINE_FAILED' }))
    });
  }

  loadCandidates(): void {
    this.candidatesMode = true;
    this.lastId = null;
    this.stateSignal.update((state) => ({ ...state, status: 'loading', message: null }));
    this.api.fulfillmentCandidates().subscribe({
      next: (candidates) => this.stateSignal.set({ status: candidates.length ? 'success' : 'empty', page: null, item: null, events: [], candidates, message: null }),
      error: () => this.stateSignal.update((state) => ({ ...state, status: 'error', message: 'FULFILLMENT_CANDIDATES_LOAD_FAILED' }))
    });
  }

  confirm(id: string, version: number): void { this.command(() => this.api.confirmSalesOrder(id, version), 'SALES_ORDER_CONFIRM_FAILED'); }
  reject(id: string, version: number, reason: string): void {
    if (!reason.trim()) { this.stateSignal.update((state) => ({ ...state, message: 'SALES_ORDER_REJECTION_REASON_REQUIRED' })); return; }
    this.command(() => this.api.rejectSalesOrder(id, version, reason), 'SALES_ORDER_REJECT_FAILED');
  }
  cancel(id: string, version: number, reason = ''): void { this.command(() => this.api.cancelSalesOrder(id, version, reason), 'SALES_ORDER_CANCEL_FAILED'); }

  retry(): void { this.candidatesMode ? this.loadCandidates() : this.lastId ? this.loadDetail(this.lastId) : this.load(this.lastFilters); }

  private command(request: () => ReturnType<SalesCommitmentApiService['confirmSalesOrder']>, message: string): void {
    request().subscribe({ next: (item) => this.stateSignal.update((state) => ({ ...state, item, status: 'success', message: null })), error: () => this.stateSignal.update((state) => ({ ...state, message })) });
  }
}
