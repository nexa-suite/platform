import { Injectable, inject, signal } from '@angular/core';
import { PurchaseRequest, PurchaseRequestPage } from '../domain/purchase-request.models';
import { SalesOperationsApiService } from '../../infrastructure/http/sales-operations-api.service';

@Injectable({ providedIn: 'root' })
export class PurchaseRequestOperationsFacade {
  private readonly api = inject(SalesOperationsApiService);
  readonly state = signal<{ readonly status: 'idle'|'loading'|'success'|'empty'|'error'; readonly page: PurchaseRequestPage | null; readonly item: PurchaseRequest | null; readonly message: string | null }>({ status: 'idle', page: null, item: null, message: null });
  load(filters: Record<string, string | number> = {}): void { this.state.update((state) => ({ ...state, status: 'loading', message: null })); this.api.purchaseRequests(filters).subscribe({ next: (page) => this.state.set({ status: page.items.length ? 'success' : 'empty', page, item: null, message: null }), error: () => this.state.update((state) => ({ ...state, status: 'error', message: 'PURCHASE_REQUESTS_LOAD_FAILED' })) }); }
  loadDetail(id: string): void { this.state.update((state) => ({ ...state, status: 'loading', message: null })); this.api.purchaseRequest(id).subscribe({ next: (item) => this.state.set({ status: 'success', page: null, item, message: null }), error: () => this.state.update((state) => ({ ...state, status: 'error', message: 'PURCHASE_REQUEST_LOAD_FAILED' })) }); }
  transition(id: string, version: number, action: 'reviews'|'adjustment-requests'|'approvals'|'rejections'): void { this.api.transition(id, version, action).subscribe({ next: (item) => this.state.update((state) => ({ ...state, item, status: 'success' })), error: () => this.state.update((state) => ({ ...state, message: 'CONCURRENCY_OR_TRANSITION_FAILED' })) }); }
  retry(): void { this.load(); }
}
