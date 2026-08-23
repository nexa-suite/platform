import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, tap, throwError } from 'rxjs';
import { CatalogApiService } from '../../../catalog-management/infrastructure/http/catalog-api.service';
import { CatalogFilters, DEFAULT_CATALOG_FILTERS, ProductCatalogItem } from '../../../catalog-management/domain/models/catalog.models';
import { SalesCommitmentAddressCommand, SalesCommitmentAddressReference, SalesCommitmentCustomerReference, DEFAULT_SALES_COMMITMENT_CUSTOMER_FILTERS } from '../../domain/customer-reference.models';
import { SalesCommitmentCustomerGateway } from '../../infrastructure/customer/sales-commitment-customer.gateway';
import { SalesCommitmentApiService } from '../../infrastructure/http/sales-commitment-api.service';
import {
  ManualOrderClientCommand,
  ManualOrderDeliveryCommand,
  ManualOrderDraft,
  ManualOrderLineCommand,
  ManualOrderReview
} from '../domain/manual-order.models';
import { SalesOrder } from '../../sales-orders/domain/sales-order.models';

export type ManualOrderWizardStateStatus = 'idle' | 'loading' | 'saving' | 'success' | 'error';

export interface ManualOrderWizardState {
  readonly status: ManualOrderWizardStateStatus;
  readonly draft: ManualOrderDraft | null;
  readonly review: ManualOrderReview | null;
  readonly clients: readonly SalesCommitmentCustomerReference[];
  readonly catalogItems: readonly ProductCatalogItem[];
  readonly addresses: readonly SalesCommitmentAddressReference[];
  readonly message: string | null;
}

const INITIAL_STATE: ManualOrderWizardState = {
  status: 'idle', draft: null, review: null, clients: [], catalogItems: [], addresses: [], message: null
};

@Injectable()
export class ManualOrderWizardFacade {
  private readonly api = inject(SalesCommitmentApiService);
  private readonly customer = inject(SalesCommitmentCustomerGateway);
  private readonly catalog = inject(CatalogApiService);
  private readonly stateSignal = signal<ManualOrderWizardState>(INITIAL_STATE);
  private catalogFilters: CatalogFilters = { ...DEFAULT_CATALOG_FILTERS, status: 'ACTIVE', size: 100 };
  private readonly submitKeys = new Map<string, string>();

  readonly state = this.stateSignal.asReadonly();

  createDraft(): Observable<ManualOrderDraft> {
    this.stateSignal.update((state) => ({ ...state, status: 'saving', message: null }));
    return this.api.createManualSalesOrderDraft().pipe(
      tap((draft) => this.setDraft(draft)),
      catchError((error: unknown) => this.fail('MANUAL_ORDER_DRAFT_CREATE_FAILED', error))
    );
  }

  loadDraft(id: string): void {
    this.stateSignal.update((state) => ({ ...state, status: 'loading', message: null }));
    this.api.manualSalesOrderDraft(id).subscribe({
      next: (draft) => this.setDraft(draft),
      error: (error: unknown) => { this.failMessage('MANUAL_ORDER_DRAFT_LOAD_FAILED'); void error; }
    });
  }

  loadReferences(): void {
    forkJoin({
      clients: this.customer.clientAccounts({ ...DEFAULT_SALES_COMMITMENT_CUSTOMER_FILTERS, size: 100 }),
      catalog: this.catalog.search(this.catalogFilters)
    }).subscribe({
      next: ({ clients, catalog }) => this.stateSignal.update((state) => ({ ...state, clients: clients.items, catalogItems: catalog.items, message: null })),
      error: () => this.failMessage('MANUAL_ORDER_REFERENCES_FAILED')
    });
  }

  searchCatalog(query: string): void {
    this.catalogFilters = { ...this.catalogFilters, q: query.trim(), page: 0 };
    this.catalog.search(this.catalogFilters).subscribe({
      next: (page) => this.stateSignal.update((state) => ({ ...state, catalogItems: page.items, message: null })),
      error: () => this.failMessage('MANUAL_ORDER_CATALOG_FAILED')
    });
  }

  loadAddresses(clientId: string): void {
    this.customer.clientAccountAddresses(clientId).subscribe({
      next: (addresses) => this.stateSignal.update((state) => ({ ...state, addresses, message: null })),
      error: () => this.failMessage('MANUAL_ORDER_ADDRESSES_FAILED')
    });
  }

  createAddress(clientId: string, command: SalesCommitmentAddressCommand): Observable<SalesCommitmentAddressReference> {
    return this.customer.createClientAccountAddress(clientId, command).pipe(
      tap((address) => this.stateSignal.update((state) => ({ ...state, addresses: [...state.addresses, address], message: null }))),
      catchError((error: unknown) => this.fail('MANUAL_ORDER_ADDRESS_CREATE_FAILED', error))
    );
  }

  saveClient(id: string, command: ManualOrderClientCommand): Observable<ManualOrderDraft> {
    return this.save(this.api.updateManualSalesOrderDraftClient(id, this.version(id), command));
  }

  saveItems(id: string, lines: readonly ManualOrderLineCommand[]): Observable<ManualOrderDraft> {
    return this.save(this.api.replaceManualSalesOrderDraftItems(id, this.version(id), lines));
  }

  saveDelivery(id: string, command: ManualOrderDeliveryCommand): Observable<ManualOrderDraft> {
    return this.save(this.api.updateManualSalesOrderDraftDelivery(id, this.version(id), command));
  }

  loadReview(id: string): void {
    this.stateSignal.update((state) => ({ ...state, status: 'loading', message: null }));
    this.api.reviewManualSalesOrderDraft(id).subscribe({
      next: (review) => this.stateSignal.update((state) => ({ ...state, status: 'success', draft: review.draft, review, message: null })),
      error: () => this.failMessage('MANUAL_ORDER_REVIEW_FAILED')
    });
  }

  submit(id: string): Observable<SalesOrder> {
    const key = this.submitKeys.get(id) ?? this.idempotencyKey();
    this.submitKeys.set(id, key);
    const draft = this.state().draft;
    if (!draft) return throwError(() => new Error('Manual order draft is not loaded'));
    return this.api.submitManualSalesOrderDraft(id, draft.version, key).pipe(
      tap(() => this.stateSignal.update((state) => ({ ...state, status: 'success', message: null }))),
      catchError((error: unknown) => this.fail('MANUAL_ORDER_SUBMIT_FAILED', error))
    );
  }

  abandon(id: string): Observable<ManualOrderDraft> {
    const draft = this.state().draft;
    if (!draft) return throwError(() => new Error('Manual order draft is not loaded'));
    return this.api.abandonManualSalesOrderDraft(id, draft.version).pipe(
      tap((value) => this.setDraft(value)),
      catchError((error: unknown) => this.fail('MANUAL_ORDER_ABANDON_FAILED', error))
    );
  }

  private save(operation: Observable<ManualOrderDraft>): Observable<ManualOrderDraft> {
    this.stateSignal.update((state) => ({ ...state, status: 'saving', message: null }));
    return operation.pipe(
      tap((draft) => this.setDraft(draft)),
      catchError((error: unknown) => this.fail('MANUAL_ORDER_SAVE_FAILED', error))
    );
  }

  private setDraft(draft: ManualOrderDraft): void {
    this.stateSignal.update((state) => ({ ...state, status: 'success', draft, review: null, message: null }));
  }

  private version(id: string): number {
    const draft = this.state().draft;
    if (!draft || draft.id !== id) throw new Error('Manual order draft is not loaded');
    return draft.version;
  }

  private fail(message: string, error: unknown): Observable<never> {
    this.failMessage(message);
    return throwError(() => error);
  }

  private failMessage(message: string): void {
    this.stateSignal.update((state) => ({ ...state, status: 'error', message }));
  }

  private idempotencyKey(): string {
    return globalThis.crypto?.randomUUID?.() ?? `platform-manual-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
