import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { platformApiUrl, PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
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
} from '../../client-accounts/domain/client-account.models';
import {
  ApiPageDto,
  ApiRecord,
  toClientAccount,
  toClientAccountAddress,
  toClientAccountPage,
  toReferenceOption
} from './customer-relationships-mappers';

/**
 * BC-02 client. API paths retain their existing contract vocabulary, while
 * the frontend ownership is kept out of Sales Commitment.
 */
@Injectable({ providedIn: 'root' })
export class CustomerRelationshipsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly api = (path: string) => platformApiUrl(this.config, `/api/v1${path}`);

  clientAccounts(filters: ClientAccountFilters = DEFAULT_CLIENT_ACCOUNT_FILTERS): Observable<ClientAccountPage> {
    return this.http.get<ApiPageDto>(this.api('/client-accounts'), { params: this.params({
      search: filters.q,
      status: filters.status,
      page: filters.page,
      size: filters.size
    }) }).pipe(map(toClientAccountPage));
  }

  clientAccount(id: string): Observable<ClientAccount> {
    return this.http.get<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}`)).pipe(map(toClientAccount));
  }

  buyerMembershipCandidates(): Observable<readonly BuyerMembershipCandidate[]> {
    return this.http.get<readonly BuyerMembershipCandidate[]>(this.api('/client-accounts/buyer-membership-candidates'));
  }

  createClientAccount(command: ClientAccountCreateCommand): Observable<ClientAccount> {
    return this.http.post<ApiRecord>(this.api('/client-accounts'), command).pipe(map(toClientAccount));
  }

  updateClientAccount(id: string, version: number, command: ClientAccountUpdateCommand): Observable<ClientAccount> {
    return this.http.patch<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}`), command, { headers: this.ifMatch(version) }).pipe(map(toClientAccount));
  }

  changeClientAccountStatus(id: string, version: number, action: 'activations' | 'suspensions'): Observable<ClientAccount> {
    return this.http.post<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}/${action}`), {}, { headers: this.ifMatch(version) }).pipe(map(toClientAccount));
  }

  associateBuyer(id: string, version: number, membershipId: string | null): Observable<ClientAccount> {
    return this.http.put<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}/buyer-membership`), { membershipId }, { headers: this.ifMatch(version) }).pipe(map(toClientAccount));
  }

  clientAccountAddresses(id: string): Observable<readonly ClientAccountAddress[]> {
    return this.http.get<readonly ApiRecord[]>(this.api(`/client-accounts/${encodeURIComponent(id)}/addresses`)).pipe(map((items) => items.map((item) => toClientAccountAddress(item))));
  }

  createClientAccountAddress(id: string, command: ClientAccountAddressCommand): Observable<ClientAccountAddress> {
    return this.http.post<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}/addresses`), command, { observe: 'response' }).pipe(map((response) => toClientAccountAddress(response.body ?? {}, response.headers.get('ETag'))));
  }

  updateClientAccountAddress(id: string, addressId: string, version: number, command: ClientAccountAddressUpdateCommand): Observable<ClientAccountAddress> {
    return this.http.patch<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}/addresses/${encodeURIComponent(addressId)}`), command, { observe: 'response', headers: this.ifMatch(version) }).pipe(map((response) => toClientAccountAddress(response.body ?? {}, response.headers.get('ETag'))));
  }

  setDefaultClientAccountAddress(id: string, addressId: string, version: number): Observable<ClientAccountAddress> {
    return this.http.put<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}/addresses/${encodeURIComponent(addressId)}/default`), null, { observe: 'response', headers: this.ifMatch(version) }).pipe(map((response) => toClientAccountAddress(response.body ?? {}, response.headers.get('ETag'))));
  }

  deactivateClientAccountAddress(id: string, addressId: string, version: number): Observable<ClientAccountAddress> {
    return this.http.delete<ApiRecord>(this.api(`/client-accounts/${encodeURIComponent(id)}/addresses/${encodeURIComponent(addressId)}`), { observe: 'response', headers: this.ifMatch(version) }).pipe(map((response) => toClientAccountAddress(response.body ?? {}, response.headers.get('ETag'))));
  }

  reference(resource: 'departments' | 'provinces' | 'districts' | 'road-types', parentCode?: string): Observable<readonly PeruReferenceOption[]> {
    let params = new HttpParams();
    if (parentCode) params = params.set('parentCode', parentCode);
    return this.http.get<readonly ApiRecord[]>(this.api(`/reference/${resource}`), { params }).pipe(map((items) => items.map(toReferenceOption)));
  }

  private params(values: Readonly<Record<string, string | number>>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(values)) {
      if ((typeof value === 'string' || typeof value === 'number') && value !== '') params = params.set(key, value);
    }
    return params;
  }

  private ifMatch(version: number): HttpHeaders {
    return new HttpHeaders({ 'If-Match': `"${version}"` });
  }
}
