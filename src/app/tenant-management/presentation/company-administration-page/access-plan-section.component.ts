import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { CompanyAdministrationFacade } from '../../application/company-administration.facade';
import { TenantAdministrationI18n } from '../i18n/tenant-administration-i18n.service';

@Component({
  selector: 'nexa-access-plan-section',
  imports: [MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './access-plan-section.component.html',
  styleUrl: './access-plan-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessPlanSectionComponent {
  readonly facade = inject(CompanyAdministrationFacade);
  readonly i18n = inject(TenantAdministrationI18n);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  readonly roleForm = this.formBuilder.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9._-]{2,64}$/)]],
    name: ['', Validators.required],
    description: [''],
    permissions: ['', Validators.required]
  });

  createRole(): void {
    if (!this.facade.canManage() || this.roleForm.invalid) { this.roleForm.markAllAsTouched(); return; }
    const value = this.roleForm.getRawValue();
    this.facade.createRoleDefinition({
      workspaceId: this.facade.state().selectedWorkspaceId ?? undefined,
      code: value.code.trim().toUpperCase(), name: value.name.trim(), description: value.description.trim(),
      permissions: value.permissions.split(',').map((permission) => permission.trim().toLowerCase()).filter(Boolean)
    });
    this.roleForm.reset({ code: '', name: '', description: '', permissions: '' });
  }
}
