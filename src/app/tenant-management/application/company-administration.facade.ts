import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { AuthenticationService } from '../../iam/application/authentication.service';
import {
  CustomFieldDefinition,
  INITIAL_TENANT_ADMINISTRATION_STATE,
  InvitationList,
  InvitationView,
  NotificationSettings,
  OperationalSettings,
  OrganizationProfile,
  RegionalSettings,
  RoleDefinition,
  TenantAdministrationState,
  TenantSecuritySettings,
  UnitPreferences,
  WorkspaceMembershipSummary,
  WorkspaceSettings,
  WorkspaceSummary
} from '../domain/models/company-administration.models';
import { CompanyAdministrationApiService } from '../infrastructure/http/company-administration-api.service';

@Injectable({ providedIn: 'root' })
export class CompanyAdministrationFacade {
  private readonly api = inject(CompanyAdministrationApiService);
  private readonly auth = inject(AuthenticationService);
  private readonly stateSignal = signal<TenantAdministrationState>(INITIAL_TENANT_ADMINISTRATION_STATE);
  private readonly mutationSignal = signal<string | null>(null);

  readonly state = this.stateSignal.asReadonly();
  readonly canManageOrganization = computed(() => this.auth.hasPermission('tenant.organization.manage'));
  readonly canManageWorkspace = computed(() => this.auth.hasPermission('tenant.workspace.manage'));
  readonly canInviteMembers = computed(() => this.auth.hasPermission('tenant.member.invite'));
  readonly canManageMembers = computed(() => this.auth.hasPermission('tenant.member.manage'));
  readonly canAssignRoles = computed(() => this.auth.hasPermission('tenant.role.assign'));
  readonly canManageRoleDefinitions = computed(() => this.auth.hasPermission('tenant.role.manage'));
  readonly canManageNotifications = computed(() => this.auth.hasPermission('notification.manage_preferences'));
  readonly canManageSecurity = computed(() => this.auth.hasPermission('tenant.security.manage'));
  /** Compatibility alias for callers that only need the organization profile capability. */
  readonly canManage = this.canManageOrganization;
  readonly busy = computed(() => this.mutationSignal() !== null);
  readonly mutation = this.mutationSignal.asReadonly();

  load(): void {
    const staleRecovery = this.staleRecoveryPending;
    this.staleRecoveryPending = false;
    this.stateSignal.update((state) => ({ ...state, status: 'loading', message: staleRecovery ? 'STALE_VERSION' : null, notice: null }));
    forkJoin({
      organization: this.api.organization(),
      profile: this.api.organizationProfile(),
      workspaces: this.api.workspaces(),
      memberships: this.api.memberships(),
      roleDefinitions: this.roleDefinitionsRequest(),
      regional: this.api.regionalSettings(),
      units: this.api.unitPreferences(),
      security: this.api.securitySettings(),
      customFields: this.api.customFields(true),
      accessMatrix: this.api.accessMatrix(),
      planUsage: this.api.planUsage(),
      planComparison: this.api.planComparison(),
      invitations: this.api.invitations()
    }).pipe(
      switchMap((base) => {
        const workspaceId = base.organization.currentWorkspaceId;
        if (!workspaceId) return of({ ...base, workspaceSettings: null, operational: null, notifications: null, selectedWorkspaceId: null });
        return forkJoin({
          workspaceSettings: this.api.workspaceSettings(workspaceId),
          operational: this.api.operationalSettings(workspaceId),
          notifications: this.api.notificationSettings(workspaceId),
          selectedWorkspaceId: of(workspaceId)
        }).pipe(map((scope) => ({ ...base, ...scope })));
      })
    ).subscribe({
      next: (data) => this.stateSignal.set({ ...data, membershipDetail: null, status: 'success', message: staleRecovery ? 'STALE_VERSION' : null, notice: staleRecovery ? 'STALE_RELOADED' : null }),
      error: (error: unknown) => this.stateSignal.update((state) => ({ ...state, status: 'error', message: this.errorCode(error), notice: null }))
    });
  }

  retry(): void { this.load(); }

  selectWorkspace(workspaceId: string): void {
    this.stateSignal.update((state) => ({ ...state, selectedWorkspaceId: workspaceId, message: null, notice: null }));
    forkJoin({
      workspaceSettings: this.api.workspaceSettings(workspaceId),
      operational: this.api.operationalSettings(workspaceId),
      notifications: this.api.notificationSettings(workspaceId)
    }).subscribe({
      next: (scope) => this.stateSignal.update((state) => ({ ...state, ...scope, selectedWorkspaceId: workspaceId, notice: 'Workspace settings loaded', message: null })),
      error: (error: unknown) => this.stateSignal.update((state) => ({ ...state, message: this.errorCode(error), notice: null }))
    });
  }

  loadMembershipDetail(membershipId: string): void {
    this.stateSignal.update((state) => ({ ...state, membershipDetail: null, message: null, notice: null }));
    this.api.membership(membershipId).subscribe({
      next: (membership) => this.stateSignal.update((state) => ({ ...state, membershipDetail: membership, message: null })),
      error: (error: unknown) => this.stateSignal.update((state) => ({ ...state, message: this.errorCode(error), notice: null }))
    });
  }

  clearMembershipDetail(): void { this.stateSignal.update((state) => ({ ...state, membershipDetail: null })); }

  updateOrganization(value: Omit<OrganizationProfile, 'version'>, version: number): void {
    if (!this.canManageOrganization()) return;
    this.mutate('organization', this.api.updateOrganization(value, version), (state, result) => ({ ...state, profile: result }));
  }
  createWorkspace(value: { readonly name: string; readonly slug: string }): void {
    if (!this.canManageWorkspace()) return;
    this.mutate('workspace', this.api.createWorkspace(value, this.idempotencyKey()), (state, result) => ({ ...state, workspaces: [...state.workspaces, result], notice: 'Workspace created' }));
  }
  renameWorkspace(workspaceId: string, version: number, name: string, slug?: string): void {
    if (!this.canManageWorkspace()) return;
    this.mutate('workspace', this.api.updateWorkspace(workspaceId, version, { name, slug }), (state, result) => ({ ...state, workspaces: this.replaceById(state.workspaces, result) }));
  }
  suspendWorkspace(workspaceId: string, version: number): void {
    if (!this.canManageWorkspace()) return;
    this.mutate('workspace', this.api.suspendWorkspace(workspaceId, version), (state, result) => ({ ...state, workspaces: this.replaceById(state.workspaces, result) }));
  }
  reactivateWorkspace(workspaceId: string, version: number): void {
    if (!this.canManageWorkspace()) return;
    this.mutate('workspace', this.api.reactivateWorkspace(workspaceId, version), (state, result) => ({ ...state, workspaces: this.replaceById(state.workspaces, result) }));
  }
  changeRoles(membershipId: string, version: number, roles: readonly string[]): void {
    if (!this.canAssignRoles()) return;
    this.mutate('membership', this.api.changeRoles(membershipId, version, roles), (state, result) => this.replaceMembership(state, result));
  }
  changeRoleDefinitions(membershipId: string, version: number, roleDefinitionIds: readonly string[]): void {
    if (!this.canAssignRoles()) return;
    this.mutate('membership', this.api.changeRoleDefinitions(membershipId, version, roleDefinitionIds), (state, result) => this.replaceMembership(state, result));
  }
  createRoleDefinition(value: { readonly workspaceId?: string; readonly code: string; readonly name: string; readonly description?: string; readonly permissions: readonly string[] }): void {
    if (!this.canManageRoleDefinitions()) return;
    this.mutate('role-definition', this.api.createRoleDefinition(value), (state, result) => ({ ...state, roleDefinitions: [...state.roleDefinitions, result], notice: 'Role definition created' }));
  }
  updateRoleDefinition(id: string, version: number, value: { readonly name: string; readonly description?: string; readonly permissions: readonly string[] }): void {
    if (!this.canManageRoleDefinitions()) return;
    this.mutate('role-definition', this.api.updateRoleDefinition(id, version, value), (state, result) => ({ ...state, roleDefinitions: this.replaceById(state.roleDefinitions, result) }));
  }
  deactivateRoleDefinition(role: RoleDefinition): void {
    if (!this.canManageRoleDefinitions()) return;
    this.mutate('role-definition', this.api.deactivateRoleDefinition(role.id, role.version), (state, result) => ({ ...state, roleDefinitions: this.replaceById(state.roleDefinitions, result) }));
  }
  suspend(membershipId: string, version: number): void {
    if (!this.canManageMembers()) return;
    this.mutate('membership', this.api.suspend(membershipId, version), (state, result) => this.replaceMembership(state, result));
  }
  reactivate(membershipId: string, version: number): void {
    if (!this.canManageMembers()) return;
    this.mutate('membership', this.api.reactivate(membershipId, version), (state, result) => this.replaceMembership(state, result));
  }
  updateWorkspaceSettings(value: Omit<WorkspaceSettings, 'workspaceId' | 'version'>, version: number): void {
    if (!this.canManageWorkspace()) return;
    const workspaceId = this.requireWorkspace();
    this.mutate('workspace-settings', this.api.updateWorkspaceSettings(workspaceId, value, version), (state, result) => ({ ...state, workspaceSettings: result }));
  }
  updateRegional(value: Omit<RegionalSettings, 'version'>, version: number): void {
    if (!this.canManageOrganization()) return;
    this.mutate('regional', this.api.updateRegionalSettings(value, version), (state, result) => ({ ...state, regional: result }));
  }
  updateUnits(value: Omit<UnitPreferences, 'version'>, version: number): void {
    if (!this.canManageOrganization()) return;
    this.mutate('units', this.api.updateUnitPreferences(value, version), (state, result) => ({ ...state, units: result }));
  }
  updateOperational(value: Omit<OperationalSettings, 'workspaceId' | 'version'>, version: number): void {
    if (!this.canManageWorkspace()) return;
    const workspaceId = this.requireWorkspace();
    this.mutate('operational', this.api.updateOperationalSettings(workspaceId, value, version), (state, result) => ({ ...state, operational: result }));
  }
  updateNotifications(value: NotificationSettings, version: number): void {
    if (!this.canManageNotifications()) return;
    const workspaceId = this.requireWorkspace();
    this.mutate('notifications', this.api.updateNotificationSettings(workspaceId, value, version), (state, result) => ({ ...state, notifications: result }));
  }
  updateSecurity(value: Omit<TenantSecuritySettings, 'version'>, version: number): void {
    if (!this.canManageSecurity()) return;
    this.mutate('security', this.api.updateSecuritySettings(value, version), (state, result) => ({ ...state, security: result }));
  }
  createCustomField(value: Omit<CustomFieldDefinition, 'id' | 'version'>): void {
    if (!this.canManageWorkspace()) return;
    this.mutate('custom-field', this.api.createCustomField(value), (state, result) => ({ ...state, customFields: [...state.customFields, result] }));
  }
  updateCustomField(id: string, value: Omit<CustomFieldDefinition, 'id' | 'version'>, version: number): void {
    if (!this.canManageWorkspace()) return;
    this.mutate('custom-field', this.api.updateCustomField(id, value, version), (state, result) => ({ ...state, customFields: this.replaceById(state.customFields, result) }));
  }
  toggleCustomField(field: CustomFieldDefinition): void {
    if (!this.canManageWorkspace()) return;
    const request$ = field.active ? this.api.deactivateCustomField(field.id, field.version) : this.api.activateCustomField(field.id, field.version);
    this.mutate('custom-field', request$, (state, result) => ({ ...state, customFields: this.replaceById(state.customFields, result) }));
  }
  createInvitation(value: { readonly email: string; readonly displayName: string; readonly roles: readonly string[] }): void {
    if (!this.canInviteMembers()) return;
    this.mutate('invitation', this.api.createInvitation(value, this.idempotencyKey()), (state, result) => ({ ...state, invitations: this.appendInvitation(state.invitations, result), notice: 'Invitation created' }));
  }
  revokeInvitation(value: InvitationView): void {
    if (!this.canManageMembers()) return;
    this.mutate('invitation', this.api.revokeInvitation(value.id, value.version), (state, result) => ({ ...state, invitations: this.replaceInvitation(state.invitations, result) }));
  }
  resendInvitation(value: InvitationView): void {
    if (!this.canManageMembers()) return;
    this.mutate('invitation', this.api.resendInvitation(value.id, value.version), (state, result) => ({ ...state, invitations: this.replaceInvitation(state.invitations, result) }));
  }

  private mutate<T>(operation: string, request$: Observable<T>, update: (state: TenantAdministrationState, result: T) => TenantAdministrationState): void {
    this.mutationSignal.set(operation);
    this.stateSignal.update((state) => ({ ...state, message: null, notice: null }));
    request$.subscribe({
      next: (result) => { this.stateSignal.update((state) => update({ ...state, message: null, notice: `${operation} saved` }, result)); this.mutationSignal.set(null); },
      error: (error: unknown) => {
        this.mutationSignal.set(null);
        if (this.isStale(error)) {
          this.staleRecoveryPending = true;
          this.load();
          return;
        }
        this.stateSignal.update((state) => ({ ...state, message: this.errorCode(error), notice: null }));
      }
    });
  }

  private requireWorkspace(): string {
    const id = this.stateSignal().selectedWorkspaceId ?? this.stateSignal().organization?.currentWorkspaceId;
    if (!id) throw new Error('WORKSPACE_NOT_SELECTED');
    return id;
  }
  private idempotencyKey(): string { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`; }
  private staleRecoveryPending = false;
  private errorCode(error: unknown): string {
    if (error instanceof HttpErrorResponse) return String(error.error?.code ?? error.error?.title ?? `HTTP_${error.status}`);
    return error instanceof Error ? error.message : 'REQUEST_FAILED';
  }
  private replaceById<T extends { readonly id: string }>(items: readonly T[], item: T): readonly T[] { return items.map((current) => current.id === item.id ? item : current); }
  private replaceMembership(state: TenantAdministrationState, result: WorkspaceMembershipSummary): TenantAdministrationState {
    return {
      ...state,
      memberships: this.replaceById(state.memberships, result),
      membershipDetail: state.membershipDetail?.id === result.id ? result : state.membershipDetail
    };
  }
  private isStale(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) return false;
    return error.status === 409 || error.status === 412 || error.error?.code === 'CONCURRENCY_CONFLICT';
  }
  private replaceInvitation(list: InvitationList, item: InvitationView): InvitationList { return { ...list, items: this.replaceById(list.items, item) }; }
  private appendInvitation(list: InvitationList, item: InvitationView): InvitationList { return { ...list, items: [item, ...list.items] }; }
  private roleDefinitionsRequest(): Observable<readonly RoleDefinition[]> {
    const request = (this.api as CompanyAdministrationApiService & { roleDefinitions?: () => Observable<readonly RoleDefinition[]> }).roleDefinitions;
    return typeof request === 'function' ? request.call(this.api).pipe(catchError(() => of([]))) : of([]);
  }
}
