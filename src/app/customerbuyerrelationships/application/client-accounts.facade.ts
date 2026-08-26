import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { BuyerMembershipCandidate, ClientAccountAddress, ClientAccountAddressCommand, ClientAccountAddressUpdateCommand, ClientAccountCreateCommand, ClientAccountFilters, ClientAccountUpdateCommand, ClientAccountsState, DEFAULT_CLIENT_ACCOUNT_FILTERS, PeruReferenceOption } from '../domain/client-account.models';
import { Observable } from 'rxjs';
import { ChangeFeedService } from '../../core/change-feed/application/change-feed.service';
import { CustomerRelationshipsApiPort } from '../domain/ports/customer-relationships-api.port';

@Injectable()
export class ClientAccountsFacade {
  private readonly api = inject(CustomerRelationshipsApiPort);
  private readonly feed = inject(ChangeFeedService, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly stateSignal = signal<ClientAccountsState>({ status: 'idle', page: null, item: null, message: null });
  private lastFilters: ClientAccountFilters = DEFAULT_CLIENT_ACCOUNT_FILTERS;
  private lastId: string | null = null;

  readonly state = this.stateSignal.asReadonly();

  constructor() {
    this.feed?.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event.eventType === 'resync-required' || /client[-_]?account/i.test(event.resourceType)) {
        if (this.lastId) this.loadDetail(this.lastId); else this.load(this.lastFilters);
      }
    });
  }

  load(filters: ClientAccountFilters = DEFAULT_CLIENT_ACCOUNT_FILTERS): void {
    this.lastFilters = filters;
    this.lastId = null;
    const hasItems = (this.stateSignal().page?.items.length ?? 0) > 0;
    this.stateSignal.update((state) => ({ ...state, status: hasItems ? 'retrying' : 'loading', message: null }));
    this.api.clientAccounts(filters).subscribe({
      next: (page) => this.stateSignal.set({ status: page.items.length ? 'success' : 'empty', page, item: null, message: null }),
      error: () => this.stateSignal.update((state) => ({ ...state, status: 'error', message: 'CLIENT_ACCOUNTS_LOAD_FAILED' }))
    });
  }

  loadDetail(id: string): void {
    this.lastId = id;
    const hasItem = this.stateSignal().item !== null;
    this.stateSignal.update((state) => ({ ...state, status: hasItem ? 'retrying' : 'loading', message: null }));
    this.api.clientAccount(id).subscribe({
      next: (item) => this.stateSignal.set({ status: 'success', page: null, item, message: null }),
      error: () => this.stateSignal.update((state) => ({ ...state, status: 'error', message: 'CLIENT_ACCOUNT_LOAD_FAILED' }))
    });
  }

  create(command: ClientAccountCreateCommand): void {
    this.api.createClientAccount(command).subscribe({ next: (item) => this.stateSignal.update((state) => ({ ...state, status: 'success', item, message: null })), error: () => this.fail('CLIENT_ACCOUNT_CREATE_FAILED') });
  }

  update(id: string, version: number, command: ClientAccountUpdateCommand): void {
    this.api.updateClientAccount(id, version, command).subscribe({ next: (item) => this.stateSignal.update((state) => ({ ...state, status: 'success', item, message: null })), error: () => this.fail('CLIENT_ACCOUNT_CONCURRENCY_FAILED') });
  }

  changeStatus(id: string, version: number, action: 'activations' | 'suspensions'): void {
    this.api.changeClientAccountStatus(id, version, action).subscribe({ next: (item) => this.stateSignal.update((state) => ({ ...state, item, message: null })), error: () => this.fail('CLIENT_ACCOUNT_CONCURRENCY_FAILED') });
  }

  associateBuyer(id: string, version: number, membershipId: string | null): void {
    this.api.associateBuyer(id, version, membershipId).subscribe({ next: (item) => this.stateSignal.update((state) => ({ ...state, item, message: null })), error: () => this.fail('CLIENT_ACCOUNT_CONCURRENCY_FAILED') });
  }

  retry(): void { this.lastId ? this.loadDetail(this.lastId) : this.load(this.lastFilters); }

  buyerMembershipCandidates(): Observable<readonly BuyerMembershipCandidate[]> { return this.api.buyerMembershipCandidates(); }
  clientAccountAddresses(id: string): Observable<readonly ClientAccountAddress[]> { return this.api.clientAccountAddresses(id); }
  createClientAccountAddress(id: string, command: ClientAccountAddressCommand): Observable<ClientAccountAddress> { return this.api.createClientAccountAddress(id, command); }
  updateClientAccountAddress(id: string, addressId: string, version: number, command: ClientAccountAddressUpdateCommand): Observable<ClientAccountAddress> { return this.api.updateClientAccountAddress(id, addressId, version, command); }
  setDefaultClientAccountAddress(id: string, addressId: string, version: number): Observable<ClientAccountAddress> { return this.api.setDefaultClientAccountAddress(id, addressId, version); }
  deactivateClientAccountAddress(id: string, addressId: string, version: number): Observable<ClientAccountAddress> { return this.api.deactivateClientAccountAddress(id, addressId, version); }
  reference(resource: 'departments' | 'provinces' | 'districts' | 'road-types', parentCode?: string): Observable<readonly PeruReferenceOption[]> { return this.api.reference(resource, parentCode); }

  private fail(message: string): void { this.stateSignal.update((state) => ({ ...state, message })); }
}
