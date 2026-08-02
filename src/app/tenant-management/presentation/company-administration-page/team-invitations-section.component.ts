import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
  readonly fixedRoles = FIXED_ROLES;
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly invitationForm = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    displayName: ['', [Validators.required, Validators.maxLength(160)]],
    roles: this.fb.control<string[]>(['SALES'], Validators.minLength(1))
  });

  invite(): void {
    if (!this.facade.canManage() || this.invitationForm.invalid) { this.invitationForm.markAllAsTouched(); return; }
    this.facade.createInvitation(this.invitationForm.getRawValue());
    this.invitationForm.reset({ email: '', displayName: '', roles: ['SALES'] });
  }

  changeRoles(member: WorkspaceMembershipSummary, roles: readonly string[]): void {
    if (!this.facade.canManage()) return;
    this.facade.changeRoles(member.id, member.version, roles);
  }

  toggleMembership(member: WorkspaceMembershipSummary): void {
    if (!this.facade.canManage()) return;
    if (member.status === 'ACTIVE') this.facade.suspend(member.id, member.version); else this.facade.reactivate(member.id, member.version);
  }
}
