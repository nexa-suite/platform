import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { platformApiUrl, PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { OrganizationSummary, WorkspaceMembershipSummary, WorkspaceSummary } from '../../domain/models/company-administration.models';

interface WorkspaceDetails { readonly workspace: WorkspaceSummary; readonly memberships: readonly WorkspaceMembershipSummary[]; }

@Injectable({ providedIn: 'root' })
export class CompanyAdministrationApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly base = '/api/v1';

  organization(): Observable<OrganizationSummary> { return this.http.get<OrganizationSummary>(platformApiUrl(this.config, `${this.base}/organization/current`)); }
  workspaces(): Observable<readonly WorkspaceSummary[]> { return this.http.get<readonly WorkspaceSummary[]>(platformApiUrl(this.config, `${this.base}/workspaces`)); }
  workspace(id: string): Observable<WorkspaceDetails> { return this.http.get<WorkspaceDetails>(platformApiUrl(this.config, `${this.base}/workspaces/${encodeURIComponent(id)}`)); }
  memberships(): Observable<readonly WorkspaceMembershipSummary[]> { return this.http.get<readonly WorkspaceMembershipSummary[]>(platformApiUrl(this.config, `${this.base}/workspace-memberships`)); }
  updateWorkspace(id: string, version: number, body: { readonly name?: string; readonly status?: string }): Observable<WorkspaceSummary> { return this.http.patch<WorkspaceSummary>(platformApiUrl(this.config, `${this.base}/workspaces/${encodeURIComponent(id)}`), body, { observe: 'body', headers: this.ifMatch(version) }); }
  changeRoles(id: string, version: number, roles: readonly string[]): Observable<WorkspaceMembershipSummary> { return this.http.patch<WorkspaceMembershipSummary>(platformApiUrl(this.config, `${this.base}/workspace-memberships/${encodeURIComponent(id)}/roles`), { roles }, { headers: this.ifMatch(version) }); }
  suspend(id: string, version: number): Observable<WorkspaceMembershipSummary> { return this.http.post<WorkspaceMembershipSummary>(platformApiUrl(this.config, `${this.base}/workspace-memberships/${encodeURIComponent(id)}/suspensions`), {}, { headers: this.ifMatch(version) }); }
  reactivate(id: string, version: number): Observable<WorkspaceMembershipSummary> { return this.http.post<WorkspaceMembershipSummary>(platformApiUrl(this.config, `${this.base}/workspace-memberships/${encodeURIComponent(id)}/reactivations`), {}, { headers: this.ifMatch(version) }); }
  private ifMatch(version: number): HttpHeaders { return new HttpHeaders({ 'If-Match': `"${version}"` }); }
}
