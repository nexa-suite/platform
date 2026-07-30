import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { platformApiUrl, PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { ClientAccount, ClientAccountPage } from '../../client-accounts/domain/client-account.models';
import { PurchaseRequest, PurchaseRequestPage } from '../../purchase-requests/domain/purchase-request.models';

@Injectable({ providedIn: 'root' })
export class SalesOperationsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly api = (path: string) => platformApiUrl(this.config, `/api/v1${path}`);
  clientAccounts(search = '', status = '', page = 0, size = 25): Observable<ClientAccountPage> { let params = new HttpParams().set('page', page).set('size', size); if (search) params=params.set('search', search); if (status) params=params.set('status', status); return this.http.get<ClientAccountPage>(this.api('/client-accounts'), { params }); }
  clientAccount(id: string): Observable<ClientAccount> { return this.http.get<ClientAccount>(this.api(`/client-accounts/${encodeURIComponent(id)}`)); }
  createClientAccount(body: Partial<ClientAccount>): Observable<ClientAccount> { return this.http.post<ClientAccount>(this.api('/client-accounts'), body); }
  updateClientAccount(id: string, version: number, body: Partial<ClientAccount>): Observable<ClientAccount> { return this.http.patch<ClientAccount>(this.api(`/client-accounts/${encodeURIComponent(id)}`), body, { headers: this.ifMatch(version) }); }
  changeClientAccountStatus(id: string, version: number, action: 'activations' | 'suspensions'): Observable<ClientAccount> { return this.http.post<ClientAccount>(this.api(`/client-accounts/${encodeURIComponent(id)}/${action}`), {}, { headers: this.ifMatch(version) }); }
  associateBuyer(id: string, version: number, membershipId: string): Observable<ClientAccount> { return this.http.put<ClientAccount>(this.api(`/client-accounts/${encodeURIComponent(id)}/buyer-membership`), { membershipId }, { headers: this.ifMatch(version) }); }
  purchaseRequests(params: Record<string, string | number> = {}): Observable<PurchaseRequestPage> { let query = new HttpParams(); for (const [key,value] of Object.entries(params)) query=query.set(key,value); return this.http.get<PurchaseRequestPage>(this.api('/purchase-requests'), { params: query }); }
  purchaseRequest(id: string): Observable<PurchaseRequest> { return this.http.get<PurchaseRequest>(this.api(`/purchase-requests/${encodeURIComponent(id)}`)); }
  transition(id: string, version: number, action: 'reviews' | 'adjustment-requests' | 'approvals' | 'rejections', reviewNote = ''): Observable<PurchaseRequest> { return this.http.post<PurchaseRequest>(this.api(`/purchase-requests/${encodeURIComponent(id)}/${action}`), { reviewNote }, { headers: this.ifMatch(version) }); }
  private ifMatch(version: number): HttpHeaders { return new HttpHeaders({ 'If-Match': `"${version}"` }); }
}
