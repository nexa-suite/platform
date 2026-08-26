import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, tap, throwError } from 'rxjs';
import { DEFAULT_SALES_COMMITMENT_CUSTOMER_FILTERS, SalesCommitmentAddressCommand, SalesCommitmentAddressReference, SalesCommitmentCustomerReference, SalesCommitmentReferenceOption } from '../../domain/customer-reference.models';
import { SalesCommitmentCatalogItem } from '../../domain/sales-commitment-catalog.models';
import { SalesCommitmentCatalogPort, SalesCommitmentCustomerPort } from '../../domain/ports/sales-commitment-cross-context.ports';
import {
  CreatePurchaseRequestCommand,
  CreateManualSalesOrderCommand,
  PurchaseRequestLineCommand,
  UpdatePurchaseRequestCommand,
  UpdatePurchaseRequestLineCommand
} from '../../domain/purchase-requests/purchase-request.models';
import { SalesCommitmentApiPort } from '../../domain/ports/sales-commitment-api.port';
import { PurchaseRequest } from '../../domain/purchase-requests/purchase-request.models';
import { SalesOrder } from '../../domain/sales-orders/sales-order.models';

export type RequestBuilderStatus = 'idle' | 'loading' | 'saving' | 'success' | 'error';

export interface RequestBuilderState {
  readonly status: RequestBuilderStatus;
  readonly request: PurchaseRequest | null;
  readonly clients: readonly SalesCommitmentCustomerReference[];
  readonly catalogItems: readonly SalesCommitmentCatalogItem[];
  readonly message: string | null;
}

const INITIAL_STATE: RequestBuilderState = {
  status: 'idle', request: null, clients: [], catalogItems: [], message: null
};

@Injectable()
export class RequestBuilderFacade {
  private readonly api = inject(SalesCommitmentApiPort);
  private readonly customer = inject(SalesCommitmentCustomerPort);
  private readonly catalog = inject(SalesCommitmentCatalogPort);
  private readonly stateSignal = signal<RequestBuilderState>(INITIAL_STATE);

  readonly state = this.stateSignal.asReadonly();
  readonly manualOrder = signal<SalesOrder | null>(null);

  loadReferences(): void {
    this.stateSignal.update((state) => ({ ...state, status: 'loading', message: null }));
    forkJoin({
      clients: this.customer.clientAccounts({ ...DEFAULT_SALES_COMMITMENT_CUSTOMER_FILTERS, size: 100 }),
      catalog: this.catalog.search()
    }).subscribe({
      next: ({ clients, catalog }) => this.stateSignal.update((state) => ({
        ...state, status: 'success', clients: clients.items, catalogItems: catalog.items, message: null
      })),
      error: () => this.fail('REQUEST_BUILDER_REFERENCES_FAILED')
    });
  }

  searchCatalog(query: string): void {
    this.catalog.search(query).subscribe({
      next: (page) => this.stateSignal.update((state) => ({ ...state, catalogItems: page.items, message: null })),
      error: () => this.fail('REQUEST_BUILDER_CATALOG_FAILED')
    });
  }

  loadRequest(id: string): void {
    this.stateSignal.update((state) => ({ ...state, status: 'loading', message: null }));
    this.api.purchaseRequest(id).subscribe({
      next: (request) => this.stateSignal.update((state) => ({ ...state, status: 'success', request, message: null })),
      error: () => this.fail('REQUEST_BUILDER_REQUEST_FAILED')
    });
  }

  create(command: CreatePurchaseRequestCommand): Observable<PurchaseRequest> {
    return this.runSave(this.api.createPurchaseRequest(command));
  }

  createManualOrder(command: CreateManualSalesOrderCommand): Observable<SalesOrder> {
    this.stateSignal.update((state) => ({ ...state, status: 'saving', message: null }));
    return this.api.createManualSalesOrder(command).pipe(
      tap((order) => { this.manualOrder.set(order); this.stateSignal.update((state) => ({ ...state, status: 'success', message: null })); }),
      catchError((error: unknown) => { this.fail('MANUAL_SALES_ORDER_CREATE_FAILED'); return throwError(() => error); }),
    );
  }

  update(id: string, version: number, command: UpdatePurchaseRequestCommand): Observable<PurchaseRequest> {
    return this.runSave(this.api.updatePurchaseRequest(id, version, command));
  }

  addLine(id: string, version: number, command: PurchaseRequestLineCommand): Observable<PurchaseRequest> {
    return this.runSave(this.api.addPurchaseRequestLine(id, version, command));
  }

  updateLine(id: string, lineId: string, version: number, command: UpdatePurchaseRequestLineCommand): Observable<PurchaseRequest> {
    return this.runSave(this.api.updatePurchaseRequestLine(id, lineId, version, command));
  }

  deleteLine(id: string, lineId: string, version: number): Observable<PurchaseRequest> {
    return this.runSave(this.api.deletePurchaseRequestLine(id, lineId, version));
  }

  submit(id: string, version: number): Observable<PurchaseRequest> {
    return this.runSave(this.api.submitPurchaseRequest(id, version));
  }

  clientAccountAddresses(id: string): Observable<readonly SalesCommitmentAddressReference[]> { return this.customer.clientAccountAddresses(id); }
  reference(resource: 'departments' | 'provinces' | 'districts' | 'road-types', parentCode?: string): Observable<readonly SalesCommitmentReferenceOption[]> { return this.customer.reference(resource, parentCode); }

  private runSave(operation: Observable<PurchaseRequest>): Observable<PurchaseRequest> {
    this.stateSignal.update((state) => ({ ...state, status: 'saving', message: null }));
    return operation.pipe(
      tap((request) => this.stateSignal.update((state) => ({ ...state, status: 'success', request, message: null }))),
      catchError((error: unknown) => {
        this.fail('REQUEST_BUILDER_SAVE_FAILED');
        return throwError(() => error);
      })
    );
  }

  private fail(message: string): void {
    this.stateSignal.update((state) => ({ ...state, status: 'error', message }));
  }
}
