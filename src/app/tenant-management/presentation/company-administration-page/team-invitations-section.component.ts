import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { CompanyAdministrationFacade } from '../../application/company-administration.facade';
import { WorkspaceMembershipSummary } from '../../domain/models/company-administration.models';
import { TenantAdministrationI18n } from '../i18n/tenant-administration-i18n.service';

const FIXED_ROLES = ['TENANT_ADMIN', 'SALES', 'WAREHOUSE', 'LOGISTICS'] as const;
type RoleOption = { readonly value: string; readonly label: string; readonly disabled?: boolean };

@Component({
  selector: 'nexa-team-invitations-section',
  imports: [DatePipe, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule],
  templateUrl: './team-invitations-section.component.html',
  styleUrl: './team-invitations-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamInvitationsSectionComponent {
  readonly facade = inject(CompanyAdministrationFacade);
  readonly i18n = inject(TenantAdministrationI18n);
  readonly fixedRoles = FIXED_ROLES;
  readonly assignableRoles = computed<readonly RoleOption[]>(() => {
    const definitions = this.facade.state().roleDefinitions.filter((role) => role.status === 'ACTIVE');
    return definitions.length
      ? definitions.filter((role) => role.code.toUpperCase() !== 'COMPANY_OWNER').map((role) => ({ value: role.id, label: role.name || role.code }))
      : this.fixedRoles.map((role) => ({ value: role, label: this.i18n.role(role) }));
  });
  readonly pendingRoleChange = signal<{ readonly member: WorkspaceMembershipSummary; readonly roles: readonly string[] } | null>(null);
  readonly pendingMembershipLifecycle = signal<{ readonly member: WorkspaceMembershipSummary; readonly action: 'suspend' | 'reactivate' } | null>(null);
  readonly ownerRoleError = signal<string | null>(null);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly invitationForm = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    displayName: ['', [Validators.required, Validators.maxLength(160)]],
    roles: this.fb.control<string[]>(['SALES'], Validators.minLength(1))
  });

  invite(): void {
    if (!this.facade.canInviteMembers() || this.invitationForm.invalid) { this.invitationForm.markAllAsTouched(); return; }
    this.facade.createInvitation(this.invitationForm.getRawValue());
    this.invitationForm.reset({ email: '', displayName: '', roles: ['SALES'] });
  }

  requestRoleChange(member: WorkspaceMembershipSummary, roles: readonly string[]): void {
    if (!this.facade.canAssignRoles()) return;
    this.ownerRoleError.set(null);
    if (this.isLastActiveOwnerRemoval(member, roles)) {
      this.ownerRoleError.set('LAST_ACTIVE_OWNER_REQUIRED');
      return;
    }
    if (roles.length === 0) return;
    if (this.sameRoles(member.roles, roles)) return;
    this.pendingRoleChange.set({ member, roles: [...roles].sort() });
  }

  confirmRoleChange(): void {
    const pending = this.pendingRoleChange();
    if (!pending || !this.facade.canAssignRoles()) return;
    this.pendingRoleChange.set(null);
    if (this.facade.state().roleDefinitions.length) this.facade.changeRoleDefinitions(pending.member.id, pending.member.version, pending.roles);
    else this.facade.changeRoles(pending.member.id, pending.member.version, pending.roles);
  }

  cancelRoleChange(): void { this.pendingRoleChange.set(null); }

  assignableRolesFor(member: WorkspaceMembershipSummary): readonly RoleOption[] {
    if (!this.hasCompanyOwnerRole(member)) return this.assignableRoles();
    const ownerValue = this.ownerRoleValue(member);
    return [{ value: ownerValue, label: this.i18n.role('COMPANY_OWNER'), disabled: true }, ...this.assignableRoles()];
  }

  selectedRoles(member: WorkspaceMembershipSummary): readonly string[] {
    const pending = this.pendingRoleChange();
    if (pending?.member.id === member.id) return pending.roles;
    return this.facade.state().roleDefinitions.length ? (member.roleDefinitionIds ?? []) : member.roles;
  }

  roleNames(roles: readonly string[]): string { return roles.map((role) => this.roleLabel(role)).join(', '); }

  openMemberDetail(member: WorkspaceMembershipSummary): void {
    this.facade.loadMembershipDetail(member.id);
  }

  closeMemberDetail(): void {
    this.facade.clearMembershipDetail();
  }

  toggleMembership(member: WorkspaceMembershipSummary): void {
	this.requestMembershipLifecycle(member);
  }

  requestMembershipLifecycle(member: WorkspaceMembershipSummary): void {
    if (!this.facade.canManageMembers()) return;
    this.pendingMembershipLifecycle.set({ member, action: member.status === 'ACTIVE' ? 'suspend' : 'reactivate' });
  }

  confirmMembershipLifecycle(): void {
    const pending = this.pendingMembershipLifecycle();
    if (!pending || !this.facade.canManageMembers()) return;
    this.pendingMembershipLifecycle.set(null);
    if (pending.action === 'suspend') this.facade.suspend(pending.member.id, pending.member.version);
    else this.facade.reactivate(pending.member.id, pending.member.version);
  }

  cancelMembershipLifecycle(): void {
    this.pendingMembershipLifecycle.set(null);
  }

  private sameRoles(left: readonly string[], right: readonly string[]): boolean {
    return [...left].sort().join('|') === [...right].sort().join('|');
  }

  private isLastActiveOwnerRemoval(member: WorkspaceMembershipSummary, roles: readonly string[]): boolean {
    return member.status === 'ACTIVE'
      && this.hasCompanyOwnerRole(member)
      && !roles.some((role) => this.isCompanyOwnerRole(role))
      && this.facade.state().memberships.filter((candidate) => candidate.status === 'ACTIVE' && this.hasCompanyOwnerRole(candidate)).length <= 1;
  }

  private hasCompanyOwnerRole(member: WorkspaceMembershipSummary): boolean {
    const roles = this.facade.state().roleDefinitions.length ? (member.roleDefinitionIds ?? []) : member.roles;
    return roles.some((role) => this.isCompanyOwnerRole(role));
  }

  private isCompanyOwnerRole(value: string): boolean {
    if (value.toUpperCase() === 'COMPANY_OWNER') return true;
    return this.facade.state().roleDefinitions.some((role) => role.id === value && role.code.toUpperCase() === 'COMPANY_OWNER');
  }

  private ownerRoleValue(member: WorkspaceMembershipSummary): string {
    const ownerDefinition = this.facade.state().roleDefinitions.find((role) => role.code.toUpperCase() === 'COMPANY_OWNER');
    return ownerDefinition && (member.roleDefinitionIds ?? []).includes(ownerDefinition.id) ? ownerDefinition.id : 'COMPANY_OWNER';
  }

  private roleLabel(value: string): string {
    const definition = this.facade.state().roleDefinitions.find((role) => role.id === value || role.code === value);
    return definition?.name || definition?.code || this.i18n.role(value.toUpperCase());
  }
}
