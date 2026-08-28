import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';
import { SalesCommitmentAddressCommand, SalesCommitmentAddressReference, SalesCommitmentCustomerReference, SalesCommitmentReferenceOption, DEFAULT_SALES_COMMITMENT_CUSTOMER_FILTERS } from '../../domain/customer-reference.models';
import { SalesCommitmentCatalogItem } from '../../domain/sales-commitment-catalog.models';
import { SalesCommitmentCatalogPort, SalesCommitmentCustomerPort } from '../../domain/ports/sales-commitment-cross-context.ports';
import { SalesCommitmentApiPort } from '../../domain/ports/sales-commitment-api.port';
import {
  ManualOrderClientCommand,
  ManualOrderDeliveryCommand,
  ManualOrderDraft,
  ManualOrderLineCommand,
  ManualOrderReview
} from '../../domain/manual-orders/manual-order.models';
import { SalesOrder } from '../../domain/sales-orders/sales-order.models';

export type ManualOrderWizardStateStatus = 'idle' | 'loading' | 'saving' | 'success' | 'error';

export interface ManualOrderWizardState {
  readonly status: ManualOrderWizardStateStatus;
  readonly draft: ManualOrderDraft | null;
  readonly review: ManualOrderReview | null;
  readonly clients: readonly SalesCommitmentCustomerReference[];
  readonly catalogItems: readonly SalesCommitmentCatalogItem[];
  readonly addresses: readonly SalesCommitmentAddressReference[];
  readonly message: string | null;
}

const INITIAL_STATE: ManualOrderWizardState = {
  status: 'idle', draft: null, review: null, clients: [], catalogItems: [], addresses: [], message: null
};

@Injectable()
export class ManualOrderWizardFacade {
  private readonly api = inject(SalesCommitmentApiPort);
  private readonly customer = inject(SalesCommitmentCustomerPort);
  private readonly catalog = inject(SalesCommitmentCatalogPort);
  private readonly stateSignal = signal<ManualOrderWizardState>(INITIAL_STATE);
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

  draft(id: string): Observable<ManualOrderDraft> { return this.api.manualSalesOrderDraft(id); }

  loadReferences(): void {
    forkJoin({
      clients: this.customer.clientAccounts({ ...DEFAULT_SALES_COMMITMENT_CUSTOMER_FILTERS, size: 100 }),
      catalog: this.catalog.search()
    }).pipe(
      switchMap(({ clients, catalog }) => {
        const detailedClients$ = clients.items.length
          ? forkJoin(clients.items.map((client) => this.customer.clientAccount(client.id).pipe(catchError(() => of(client)))))
            .pipe(map((detailedClients) => detailedClients as readonly SalesCommitmentCustomerReference[]))
          : of([] as readonly SalesCommitmentCustomerReference[]);
        return detailedClients$.pipe(map((detailedClients) => ({ clients: detailedClients, catalog })));
      })
    ).subscribe({
      next: ({ clients, catalog }) => this.stateSignal.update((state) => ({ ...state, clients, catalogItems: catalog.items, message: null })),
      error: () => this.failMessage('MANUAL_ORDER_REFERENCES_FAILED')
    });
  }

  searchCatalog(query: string): void {
    this.catalog.search(query).subscribe({
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

  reference(resource: 'departments' | 'provinces' | 'districts' | 'road-types', parentCode?: string): Observable<readonly SalesCommitmentReferenceOption[]> {
    return this.customer.reference(resource, parentCode);
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
