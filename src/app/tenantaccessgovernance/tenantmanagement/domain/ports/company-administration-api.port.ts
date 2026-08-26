import { Observable } from 'rxjs';
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
  WorkspaceSummary,
  WorkspaceDetails
} from '../models/company-administration.models';

/** Tenant-management application port. HTTP and headers stay in infrastructure. */
export abstract class CompanyAdministrationApiPort {
  abstract organization(): Observable<OrganizationSummary>;
  abstract organizationProfile(): Observable<OrganizationProfile>;
  abstract workspaces(): Observable<readonly WorkspaceSummary[]>;
  abstract workspace(id: string): Observable<WorkspaceDetails>;
  abstract memberships(): Observable<readonly WorkspaceMembershipSummary[]>;
  abstract roleDefinitions(): Observable<readonly RoleDefinition[]>;
  abstract permissionCatalog(): Observable<readonly { readonly code: string; readonly group: string; readonly legacyCodes: readonly string[] }[]>;
  abstract membership(id: string): Observable<WorkspaceMembershipSummary>;
  abstract workspaceSettings(id: string): Observable<WorkspaceSettings>;
  abstract regionalSettings(): Observable<RegionalSettings>;
  abstract unitPreferences(): Observable<UnitPreferences>;
  abstract operationalSettings(id: string): Observable<OperationalSettings>;
  abstract notificationSettings(id: string): Observable<NotificationSettings>;
  abstract securitySettings(): Observable<TenantSecuritySettings>;
  abstract customFields(includeInactive?: boolean): Observable<readonly CustomFieldDefinition[]>;
  abstract accessMatrix(): Observable<readonly AccessMatrixEntry[]>;
  abstract planUsage(): Observable<PlanUsage>;
  abstract planComparison(): Observable<readonly PlanOption[]>;
  abstract invitations(page?: number, pageSize?: number): Observable<InvitationList>;
  abstract updateOrganization(body: Omit<OrganizationProfile, 'version'>, version: number): Observable<OrganizationProfile>;
  abstract createWorkspace(body: { readonly name: string; readonly slug: string }, idempotencyKey: string): Observable<WorkspaceSummary>;
  abstract updateWorkspace(id: string, version: number, body: { readonly name?: string; readonly slug?: string }): Observable<WorkspaceSummary>;
  abstract suspendWorkspace(id: string, version: number): Observable<WorkspaceSummary>;
  abstract reactivateWorkspace(id: string, version: number): Observable<WorkspaceSummary>;
  abstract changeRoles(id: string, version: number, roles: readonly string[]): Observable<WorkspaceMembershipSummary>;
  abstract changeRoleDefinitions(id: string, version: number, roleDefinitionIds: readonly string[]): Observable<WorkspaceMembershipSummary>;
  abstract createRoleDefinition(body: { readonly workspaceId?: string; readonly code: string; readonly name: string; readonly description?: string; readonly permissions: readonly string[] }): Observable<RoleDefinition>;
  abstract updateRoleDefinition(id: string, version: number, body: { readonly name: string; readonly description?: string; readonly permissions: readonly string[] }): Observable<RoleDefinition>;
  abstract deactivateRoleDefinition(id: string, version: number): Observable<RoleDefinition>;
  abstract suspend(id: string, version: number): Observable<WorkspaceMembershipSummary>;
  abstract reactivate(id: string, version: number): Observable<WorkspaceMembershipSummary>;
  abstract updateWorkspaceSettings(id: string, body: Omit<WorkspaceSettings, 'workspaceId' | 'version'>, version: number): Observable<WorkspaceSettings>;
  abstract updateRegionalSettings(body: Omit<RegionalSettings, 'version'>, version: number): Observable<RegionalSettings>;
  abstract updateUnitPreferences(body: Omit<UnitPreferences, 'version'>, version: number): Observable<UnitPreferences>;
  abstract updateOperationalSettings(id: string, body: Omit<OperationalSettings, 'workspaceId' | 'version'>, version: number): Observable<OperationalSettings>;
  abstract updateNotificationSettings(id: string, body: NotificationSettings, version: number): Observable<NotificationSettings>;
  abstract updateSecuritySettings(body: Omit<TenantSecuritySettings, 'version'>, version: number): Observable<TenantSecuritySettings>;
  abstract createCustomField(body: Omit<CustomFieldDefinition, 'id' | 'version'>): Observable<CustomFieldDefinition>;
  abstract updateCustomField(id: string, body: Omit<CustomFieldDefinition, 'id' | 'version'>, version: number): Observable<CustomFieldDefinition>;
  abstract activateCustomField(id: string, version: number): Observable<CustomFieldDefinition>;
  abstract deactivateCustomField(id: string, version: number): Observable<CustomFieldDefinition>;
  abstract createInvitation(body: { readonly email: string; readonly displayName: string; readonly roles: readonly string[] }, idempotencyKey: string): Observable<InvitationView>;
  abstract revokeInvitation(id: string, version: number): Observable<InvitationView>;
  abstract resendInvitation(id: string, version: number): Observable<InvitationView>;
  abstract acceptInvitation(body: InvitationAcceptanceCommand): Observable<InvitationAcceptanceResult>;
}
