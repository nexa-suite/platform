import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeFeedService } from '../../../core/change-feed/infrastructure/change-feed.service';
import { SalesCommitmentApiService } from '../../infrastructure/http/sales-commitment-api.service';
import { DEFAULT_PURCHASE_REQUEST_FILTERS, PurchaseRequestAction, PurchaseRequestFilters, PurchaseRequestState } from '../domain/purchase-request.models';

@Injectable()
export class PurchaseRequestOperationsFacade {
  private readonly api = inject(SalesCommitmentApiService);
  private readonly feed = inject(ChangeFeedService, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly stateSignal = signal<PurchaseRequestState>({ status: 'idle', page: null, item: null, events: [], message: null });
  private lastFilters: PurchaseRequestFilters = DEFAULT_PURCHASE_REQUEST_FILTERS;
  private lastId: string | null = null;

  readonly state = this.stateSignal.asReadonly();

  constructor() {
    this.feed?.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event.eventType === 'resync-required' || /purchase[-_]?request/i.test(event.resourceType)) {
        if (this.lastId) this.loadDetail(this.lastId); else this.load(this.lastFilters);
      }
    });
  }

  load(filters: PurchaseRequestFilters = DEFAULT_PURCHASE_REQUEST_FILTERS): void {
    this.lastFilters = filters;
    this.lastId = null;
    const hasItems = (this.stateSignal().page?.items.length ?? 0) > 0;
    this.stateSignal.update((state) => ({ ...state, status: hasItems ? 'retrying' : 'loading', message: null }));
    this.api.purchaseRequests(filters).subscribe({
      next: (page) => this.stateSignal.set({ status: page.items.length ? 'success' : 'empty', page, item: null, events: [], message: null }),
      error: () => this.stateSignal.update((state) => ({ ...state, status: 'error', message: 'PURCHASE_REQUESTS_LOAD_FAILED' }))
    });
  }

  loadDetail(id: string): void {
    this.lastId = id;
    const hasItem = this.stateSignal().item !== null;
    this.stateSignal.update((state) => ({ ...state, status: hasItem ? 'retrying' : 'loading', message: null }));
    this.api.purchaseRequest(id).subscribe({
      next: (item) => this.stateSignal.update((state) => ({ ...state, status: 'success', item, page: null, message: null })),
      error: () => this.stateSignal.update((state) => ({ ...state, status: 'error', message: 'PURCHASE_REQUEST_LOAD_FAILED' }))
    });
    this.api.purchaseRequestEvents(id).subscribe({
      next: (events) => this.stateSignal.update((state) => ({ ...state, events })),
      error: () => this.stateSignal.update((state) => ({ ...state, message: 'PURCHASE_REQUEST_TIMELINE_FAILED' }))
    });
  }

  transition(id: string, version: number, action: PurchaseRequestAction, note = ''): void {
    if (action === 'rejections' && !note.trim()) {
      this.stateSignal.update((state) => ({ ...state, message: 'PURCHASE_REQUEST_REJECTION_REASON_REQUIRED' }));
      return;
    }
    this.api.transitionPurchaseRequest(id, version, action, note).subscribe({
      next: (item) => this.stateSignal.update((state) => ({ ...state, item, status: 'success', message: null })),
      error: () => this.stateSignal.update((state) => ({ ...state, message: 'CONCURRENCY_OR_TRANSITION_FAILED' }))
    });
  }

  convertToOrder(id: string, version: number, note = ''): void {
    this.api.convertPurchaseRequestToOrder(id, version, this.idempotencyKey(), note).subscribe({
      next: (order) => this.stateSignal.update((state) => ({ ...state, message: `ORDER_CONVERTED:${order.id}` })),
      error: () => this.stateSignal.update((state) => ({ ...state, message: 'PURCHASE_REQUEST_CONVERSION_FAILED' }))
    });
  }

  retry(): void { this.lastId ? this.loadDetail(this.lastId) : this.load(this.lastFilters); }

  private idempotencyKey(): string {
    const randomUuid = globalThis.crypto?.randomUUID;
    return randomUuid ? randomUuid.call(globalThis.crypto) : `platform-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
