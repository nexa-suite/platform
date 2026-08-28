import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import {
  BuyerMembershipCandidate,
  ClientAccount,
  ClientAccountAddress,
  ClientAccountAddressCommand,
  ClientAccountAddressUpdateCommand,
  ClientAccountCreateCommand,
  ClientAccountFilters,
  ClientAccountPage,
  ClientAccountUpdateCommand,
  DEFAULT_CLIENT_ACCOUNT_FILTERS,
  PeruReferenceOption
} from '../../domain/client-account.models';
import { CustomerRelationshipsApiPort } from '../../domain/ports/customer-relationships-api.port';
import { MOCK_CUSTOMER_FIXTURES } from './mock-customer.fixtures';

/** BC-02 demo adapter used by both client-account and sales reference flows. */
@Injectable({ providedIn: 'root' })
export class MockCustomerRelationshipsApiService implements CustomerRelationshipsApiPort {
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly accounts = new Map<string, ClientAccount>(this.fixture().accounts.map((account) => [account.id, account]));
  private readonly addresses = new Map<string, ClientAccountAddress>(this.fixture().addresses.map((address) => [address.id, address]));
  private nextAccountSequence = this.accounts.size + 1;
  private nextAddressSequence = this.addresses.size + 1;

  clientAccounts(filters: ClientAccountFilters = DEFAULT_CLIENT_ACCOUNT_FILTERS): Observable<ClientAccountPage> {
    const query = filters.q.trim().toLowerCase();
    const items = [...this.accounts.values()]
      .filter((account) => !query || [account.code, account.businessName, account.commercialName, account.contactEmail].some((value) => value.toLowerCase().includes(query)))
      .filter((account) => !filters.status || account.status === filters.status)
      .filter((account) => !filters.buyerMembershipId || account.buyerMembershipId === filters.buyerMembershipId)
      .sort((left, right) => this.compare(left, right, filters.sort, filters.direction));

    const start = filters.page * filters.size;
    return of({
      items: items.slice(start, start + filters.size),
      page: filters.page,
      size: filters.size,
      totalItems: items.length,
      totalPages: items.length ? Math.ceil(items.length / filters.size) : 0,
      sort: { field: filters.sort, direction: filters.direction }
    });
  }

  clientAccount(id: string): Observable<ClientAccount> {
    return this.valueOrError(this.accounts.get(id), 'MOCK_CLIENT_ACCOUNT_NOT_FOUND');
  }

  buyerMembershipCandidates(): Observable<readonly BuyerMembershipCandidate[]> {
    return of(this.fixture().buyerMembershipCandidates);
  }

  createClientAccount(command: ClientAccountCreateCommand): Observable<ClientAccount> {
    const id = `${this.config.tenantProfile}-client-${String(this.nextAccountSequence++).padStart(3, '0')}`;
    const account: ClientAccount = {
      id,
      ...command,
      status: 'ACTIVE',
      buyerMembershipId: null,
      version: 0
    };
    this.accounts.set(id, account);
    return of(account);
  }

  updateClientAccount(id: string, version: number, command: ClientAccountUpdateCommand): Observable<ClientAccount> {
    const current = this.accounts.get(id);
    if (!current) return throwError(() => new Error('MOCK_CLIENT_ACCOUNT_NOT_FOUND'));
    if (current.version !== version) return throwError(() => new Error('MOCK_CONCURRENCY_CONFLICT'));
    const updated = { ...current, ...command, version: current.version + 1 };
    this.accounts.set(id, updated);
    return of(updated);
  }

  changeClientAccountStatus(id: string, version: number, action: 'activations' | 'suspensions'): Observable<ClientAccount> {
    const current = this.accounts.get(id);
    if (!current) return throwError(() => new Error('MOCK_CLIENT_ACCOUNT_NOT_FOUND'));
    if (current.version !== version) return throwError(() => new Error('MOCK_CONCURRENCY_CONFLICT'));
    const updated = { ...current, status: action === 'activations' ? 'ACTIVE' : 'SUSPENDED', version: current.version + 1 };
    this.accounts.set(id, updated);
    return of(updated);
  }

  associateBuyer(id: string, version: number, membershipId: string | null): Observable<ClientAccount> {
    const current = this.accounts.get(id);
    if (!current) return throwError(() => new Error('MOCK_CLIENT_ACCOUNT_NOT_FOUND'));
    if (current.version !== version) return throwError(() => new Error('MOCK_CONCURRENCY_CONFLICT'));
    const updated = { ...current, buyerMembershipId: membershipId, version: current.version + 1 };
    this.accounts.set(id, updated);
    return of(updated);
  }

  clientAccountAddresses(id: string): Observable<readonly ClientAccountAddress[]> {
    if (!this.accounts.has(id)) return throwError(() => new Error('MOCK_CLIENT_ACCOUNT_NOT_FOUND'));
    return of([...this.addresses.values()].filter((address) => address.clientAccountId === id));
  }

  createClientAccountAddress(id: string, command: ClientAccountAddressCommand): Observable<ClientAccountAddress> {
    if (!this.accounts.has(id)) return throwError(() => new Error('MOCK_CLIENT_ACCOUNT_NOT_FOUND'));
    const address = this.toAddress(id, command, `${this.config.tenantProfile}-address-${String(this.nextAddressSequence++).padStart(3, '0')}`);
    if (address.defaultAddress) this.clearDefault(id);
    this.addresses.set(address.id, address);
    return of(address);
  }

  updateClientAccountAddress(id: string, addressId: string, version: number, command: ClientAccountAddressUpdateCommand): Observable<ClientAccountAddress> {
    const current = this.addresses.get(addressId);
    if (!current || current.clientAccountId !== id) return throwError(() => new Error('MOCK_ADDRESS_NOT_FOUND'));
    if (current.version !== version) return throwError(() => new Error('MOCK_CONCURRENCY_CONFLICT'));
    const updated: ClientAccountAddress = {
      ...current,
      ...command.address,
      label: command.label,
      version: current.version + 1
    };
    this.addresses.set(addressId, updated);
    return of(updated);
  }

  setDefaultClientAccountAddress(id: string, addressId: string, version: number): Observable<ClientAccountAddress> {
    const current = this.addresses.get(addressId);
    if (!current || current.clientAccountId !== id) return throwError(() => new Error('MOCK_ADDRESS_NOT_FOUND'));
    if (current.version !== version) return throwError(() => new Error('MOCK_CONCURRENCY_CONFLICT'));
    this.clearDefault(id);
    const updated = { ...current, defaultAddress: true, version: current.version + 1 };
    this.addresses.set(addressId, updated);
    return of(updated);
  }

  deactivateClientAccountAddress(id: string, addressId: string, version: number): Observable<ClientAccountAddress> {
    const current = this.addresses.get(addressId);
    if (!current || current.clientAccountId !== id) return throwError(() => new Error('MOCK_ADDRESS_NOT_FOUND'));
    if (current.version !== version) return throwError(() => new Error('MOCK_CONCURRENCY_CONFLICT'));
    const updated = { ...current, active: false, defaultAddress: false, version: current.version + 1 };
    this.addresses.set(addressId, updated);
    return of(updated);
  }

  reference(resource: 'departments' | 'provinces' | 'districts' | 'road-types', parentCode?: string): Observable<readonly PeruReferenceOption[]> {
    const values = this.fixture().references[resource];
    return of(parentCode ? values.filter((item) => item.parentCode === parentCode) : values);
  }

  private fixture() {
    return MOCK_CUSTOMER_FIXTURES[this.config.tenantProfile];
  }

  private valueOrError<T>(value: T | undefined, message: string): Observable<T> {
    return value === undefined ? throwError(() => new Error(message)) : of(value);
  }

  private compare(left: ClientAccount, right: ClientAccount, sort: ClientAccountFilters['sort'], direction: ClientAccountFilters['direction']): number {
    const leftValue = sort === 'createdAt' ? left.id : left[sort];
    const rightValue = sort === 'createdAt' ? right.id : right[sort];
    const result = String(leftValue).localeCompare(String(rightValue));
    return direction === 'desc' ? -result : result;
  }

  private toAddress(id: string, command: ClientAccountAddressCommand, addressId: string): ClientAccountAddress {
    return {
      id: addressId,
      clientAccountId: id,
      label: command.label,
      ...command.address,
      defaultAddress: command.defaultAddress ?? false,
      active: true,
      version: 0
    };
  }

  private clearDefault(clientAccountId: string): void {
    for (const address of this.addresses.values()) {
      if (address.clientAccountId === clientAccountId && address.defaultAddress) {
        this.addresses.set(address.id, { ...address, defaultAddress: false });
      }
    }
  }
}
