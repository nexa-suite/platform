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

const FIXED_ROLES = ['TENANT_ADMIN', 'COMPANY_OWNER', 'SALES', 'WAREHOUSE', 'LOGISTICS'] as const;

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
  readonly assignableRoles = computed(() => {
    const definitions = this.facade.state().roleDefinitions.filter((role) => role.status === 'ACTIVE');
    return definitions.length ? definitions.map((role) => ({ value: role.id, label: role.name || role.code })) : this.fixedRoles.map((role) => ({ value: role, label: this.i18n.role(role) }));
  });
  readonly pendingRoleChange = signal<{ readonly member: WorkspaceMembershipSummary; readonly roles: readonly string[] } | null>(null);
  readonly pendingMembershipLifecycle = signal<{ readonly member: WorkspaceMembershipSummary; readonly action: 'suspend' | 'reactivate' } | null>(null);
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

  private roleLabel(value: string): string {
    const definition = this.facade.state().roleDefinitions.find((role) => role.id === value || role.code === value);
    return definition?.name || definition?.code || this.i18n.role(value);
  }
}
