import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { platformApiUrl, PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import {
  AccessMatrixEntry,
  CustomFieldDefinition,
  InvitationAcceptanceCommand,
  InvitationAcceptanceResult,
  InvitationList,
  InvitationView,
  NotificationSettings,
  OperationalSettings,
  OrganizationProfile,
  OrganizationSummary,
  PlanOption,
  PlanUsage,
  RegionalSettings,
  RoleDefinition,
  TenantSecuritySettings,
  UnitPreferences,
  WorkspaceMembershipSummary,
  WorkspaceSettings,
  WorkspaceSummary
} from '../../domain/models/company-administration.models';

export interface WorkspaceDetails {
  readonly workspace: WorkspaceSummary;
  readonly memberships: readonly WorkspaceMembershipSummary[];
}

@Injectable({ providedIn: 'root' })
export class CompanyAdministrationApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly base = '/api/v1';

  organization(): Observable<OrganizationSummary> { return this.get<OrganizationSummary>('/organization/current'); }
  organizationProfile(): Observable<OrganizationProfile> { return this.get<OrganizationProfile>('/organization'); }
  workspaces(): Observable<readonly WorkspaceSummary[]> { return this.get<readonly WorkspaceSummary[]>('/workspaces'); }
  workspace(id: string): Observable<WorkspaceDetails> { return this.get<WorkspaceDetails>(`/workspaces/${encodeURIComponent(id)}`); }
  memberships(): Observable<readonly WorkspaceMembershipSummary[]> { return this.get<readonly WorkspaceMembershipSummary[]>('/workspace-memberships'); }
  roleDefinitions(): Observable<readonly RoleDefinition[]> { return this.get<readonly RoleDefinition[]>('/roles'); }
  permissionCatalog(): Observable<readonly { readonly code: string; readonly group: string; readonly legacyCodes: readonly string[] }[]> { return this.get('/permissions/catalog'); }
  membership(id: string): Observable<WorkspaceMembershipSummary> { return this.get<WorkspaceMembershipSummary>(`/workspace-memberships/${encodeURIComponent(id)}`); }
  workspaceSettings(id: string): Observable<WorkspaceSettings> { return this.get<WorkspaceSettings>(`/workspaces/${encodeURIComponent(id)}/settings`); }
  regionalSettings(): Observable<RegionalSettings> { return this.get<RegionalSettings>('/settings/regional'); }
  unitPreferences(): Observable<UnitPreferences> { return this.get<UnitPreferences>('/settings/units'); }
  operationalSettings(id: string): Observable<OperationalSettings> { return this.get<OperationalSettings>(`/workspaces/${encodeURIComponent(id)}/operational-settings`); }
  notificationSettings(id: string): Observable<NotificationSettings> { return this.get<NotificationSettings>(`/workspaces/${encodeURIComponent(id)}/notifications`); }
  securitySettings(): Observable<TenantSecuritySettings> { return this.get<TenantSecuritySettings>('/settings/security'); }
  customFields(includeInactive = true): Observable<readonly CustomFieldDefinition[]> { return this.get<readonly CustomFieldDefinition[]>(`/custom-field-definitions?includeInactive=${includeInactive}`); }
  accessMatrix(): Observable<readonly AccessMatrixEntry[]> { return this.get<readonly AccessMatrixEntry[]>('/access-matrix'); }
  planUsage(): Observable<PlanUsage> { return this.get<PlanUsage>('/plan-usage'); }
  planComparison(): Observable<readonly PlanOption[]> { return this.get<readonly PlanOption[]>('/plan-comparison'); }
  invitations(page = 0, pageSize = 25): Observable<InvitationList> { return this.get<InvitationList>(`/organization-invitations?page=${page}&pageSize=${pageSize}`); }

  updateOrganization(body: Omit<OrganizationProfile, 'version'>, version: number): Observable<OrganizationProfile> {
    return this.patch('/organization', body, version);
  }
  createWorkspace(body: { readonly name: string; readonly slug: string }, idempotencyKey: string): Observable<WorkspaceSummary> {
    return this.http.post<WorkspaceSummary>(this.url('/workspaces'), body, { headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }) });
  }
  updateWorkspace(id: string, version: number, body: { readonly name?: string; readonly slug?: string }): Observable<WorkspaceSummary> {
    return this.patch(`/workspaces/${encodeURIComponent(id)}`, body, version);
  }
  suspendWorkspace(id: string, version: number): Observable<WorkspaceSummary> { return this.command<WorkspaceSummary>(`/workspaces/${encodeURIComponent(id)}/suspensions`, version); }
  reactivateWorkspace(id: string, version: number): Observable<WorkspaceSummary> { return this.command<WorkspaceSummary>(`/workspaces/${encodeURIComponent(id)}/reactivations`, version); }
  changeRoles(id: string, version: number, roles: readonly string[]): Observable<WorkspaceMembershipSummary> { return this.patch(`/workspace-memberships/${encodeURIComponent(id)}/roles`, { roles }, version); }
  changeRoleDefinitions(id: string, version: number, roleDefinitionIds: readonly string[]): Observable<WorkspaceMembershipSummary> { return this.patch(`/workspace-memberships/${encodeURIComponent(id)}/roles`, { roleDefinitionIds }, version); }
  createRoleDefinition(body: { readonly workspaceId?: string; readonly code: string; readonly name: string; readonly description?: string; readonly permissions: readonly string[] }): Observable<RoleDefinition> { return this.http.post<RoleDefinition>(this.url('/roles'), body); }
  updateRoleDefinition(id: string, version: number, body: { readonly name: string; readonly description?: string; readonly permissions: readonly string[] }): Observable<RoleDefinition> { return this.patch(`/roles/${encodeURIComponent(id)}`, body, version); }
  deactivateRoleDefinition(id: string, version: number): Observable<RoleDefinition> { return this.http.delete<RoleDefinition>(this.url(`/roles/${encodeURIComponent(id)}`), { headers: this.ifMatch(version) }); }
  suspend(id: string, version: number): Observable<WorkspaceMembershipSummary> { return this.command<WorkspaceMembershipSummary>(`/workspace-memberships/${encodeURIComponent(id)}/suspensions`, version); }
  reactivate(id: string, version: number): Observable<WorkspaceMembershipSummary> { return this.command<WorkspaceMembershipSummary>(`/workspace-memberships/${encodeURIComponent(id)}/reactivations`, version); }
  updateWorkspaceSettings(id: string, body: Omit<WorkspaceSettings, 'workspaceId' | 'version'>, version: number): Observable<WorkspaceSettings> { return this.patch(`/workspaces/${encodeURIComponent(id)}/settings`, body, version); }
  updateRegionalSettings(body: Omit<RegionalSettings, 'version'>, version: number): Observable<RegionalSettings> { return this.patch('/settings/regional', body, version); }
  updateUnitPreferences(body: Omit<UnitPreferences, 'version'>, version: number): Observable<UnitPreferences> { return this.patch('/settings/units', body, version); }
  updateOperationalSettings(id: string, body: Omit<OperationalSettings, 'workspaceId' | 'version'>, version: number): Observable<OperationalSettings> { return this.patch(`/workspaces/${encodeURIComponent(id)}/operational-settings`, body, version); }
  updateNotificationSettings(id: string, body: NotificationSettings, version: number): Observable<NotificationSettings> { return this.patch(`/workspaces/${encodeURIComponent(id)}/notifications`, body, version); }
  updateSecuritySettings(body: Omit<TenantSecuritySettings, 'version'>, version: number): Observable<TenantSecuritySettings> { return this.patch('/settings/security', body, version); }
  createCustomField(body: Omit<CustomFieldDefinition, 'id' | 'version'>): Observable<CustomFieldDefinition> { return this.http.post<CustomFieldDefinition>(this.url('/custom-field-definitions'), body); }
  updateCustomField(id: string, body: Omit<CustomFieldDefinition, 'id' | 'version'>, version: number): Observable<CustomFieldDefinition> { return this.patch(`/custom-field-definitions/${encodeURIComponent(id)}`, body, version); }
  activateCustomField(id: string, version: number): Observable<CustomFieldDefinition> { return this.command<CustomFieldDefinition>(`/custom-field-definitions/${encodeURIComponent(id)}/activations`, version); }
  deactivateCustomField(id: string, version: number): Observable<CustomFieldDefinition> { return this.command<CustomFieldDefinition>(`/custom-field-definitions/${encodeURIComponent(id)}/deactivations`, version); }
  createInvitation(body: { readonly email: string; readonly displayName: string; readonly roles: readonly string[] }, idempotencyKey: string): Observable<InvitationView> {
    return this.http.post<InvitationView>(this.url('/organization-invitations'), body, { headers: new HttpHeaders({ 'Idempotency-Key': idempotencyKey }) });
  }
  revokeInvitation(id: string, version: number): Observable<InvitationView> { return this.command<InvitationView>(`/organization-invitations/${encodeURIComponent(id)}/revocations`, version); }
  resendInvitation(id: string, version: number): Observable<InvitationView> { return this.command<InvitationView>(`/organization-invitations/${encodeURIComponent(id)}/resends`, version); }
  acceptInvitation(body: InvitationAcceptanceCommand): Observable<InvitationAcceptanceResult> { return this.http.post<InvitationAcceptanceResult>(this.url('/organization-invitation-acceptances'), body); }

  private get<T>(path: string): Observable<T> { return this.http.get<T>(this.url(path)); }
  private patch<T>(path: string, body: unknown, version: number): Observable<T> { return this.http.patch<T>(this.url(path), body, { headers: this.ifMatch(version) }); }
  private command<T>(path: string, version: number): Observable<T> { return this.http.post<T>(this.url(path), {}, { headers: this.ifMatch(version) }); }
  private ifMatch(version: number): HttpHeaders { return new HttpHeaders({ 'If-Match': `"${version}"` }); }
  private url(path: string): string { return platformApiUrl(this.config, `${this.base}${path}`); }
}
