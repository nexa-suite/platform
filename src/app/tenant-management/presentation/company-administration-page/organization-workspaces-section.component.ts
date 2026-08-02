import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CompanyAdministrationFacade } from '../../application/company-administration.facade';
import { TenantAdministrationI18n } from '../i18n/tenant-administration-i18n.service';

@Component({
  selector: 'nexa-organization-workspaces-section',
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './organization-workspaces-section.component.html',
  styleUrl: './organization-workspaces-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationWorkspacesSectionComponent {
  readonly facade = inject(CompanyAdministrationFacade);
  readonly i18n = inject(TenantAdministrationI18n);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly profileForm = this.fb.group({
    legalName: ['', [Validators.required, Validators.maxLength(160)]],
    displayName: ['', [Validators.required, Validators.maxLength(160)]],
    businessIdentifier: ['', [Validators.maxLength(80)]],
    operationCategory: ['', [Validators.required, Validators.maxLength(80)]]
  });
  readonly workspaceCreateForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), Validators.maxLength(64)]]
  });
  readonly workspaceEditForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), Validators.maxLength(64)]]
  });
  editingWorkspaceId: string | null = null;
  private profileVersion = -1;
  private workspaceVersion = -1;

  constructor() {
    effect(() => {
      const profile = this.facade.state().profile;
      if (profile && profile.version !== this.profileVersion) {
        this.profileVersion = profile.version;
        this.profileForm.reset({ legalName: profile.legalName, displayName: profile.displayName, businessIdentifier: profile.businessIdentifier ?? '', operationCategory: profile.operationCategory });
      }
      const editing = this.facade.state().workspaces.find((workspace) => workspace.id === this.editingWorkspaceId);
      if (editing && editing.version !== this.workspaceVersion) {
        this.workspaceVersion = editing.version;
        this.workspaceEditForm.reset({ name: editing.name, slug: editing.slug });
      }
    });
  }

  saveProfile(): void {
    if (!this.facade.canManage() || this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.facade.updateOrganization({ ...this.profileForm.getRawValue(), businessIdentifier: this.profileForm.controls.businessIdentifier.value || null }, this.profileVersion);
  }

  createWorkspace(): void {
    if (!this.facade.canManage() || this.workspaceCreateForm.invalid) { this.workspaceCreateForm.markAllAsTouched(); return; }
    this.facade.createWorkspace(this.workspaceCreateForm.getRawValue());
    this.workspaceCreateForm.reset();
  }

  editWorkspace(id: string): void {
    this.editingWorkspaceId = id;
    this.workspaceVersion = -1;
  }

  cancelEdit(): void { this.editingWorkspaceId = null; this.workspaceVersion = -1; }

  saveWorkspace(): void {
    if (!this.facade.canManage() || !this.editingWorkspaceId || this.workspaceEditForm.invalid) { this.workspaceEditForm.markAllAsTouched(); return; }
    this.facade.renameWorkspace(this.editingWorkspaceId, this.workspaceVersion, this.workspaceEditForm.controls.name.value, this.workspaceEditForm.controls.slug.value);
    this.cancelEdit();
  }

  toggleWorkspace(workspace: { readonly id: string; readonly version: number; readonly status: string }): void {
    if (!this.facade.canManage()) return;
    if (workspace.status === 'ACTIVE') this.facade.suspendWorkspace(workspace.id, workspace.version); else this.facade.reactivateWorkspace(workspace.id, workspace.version);
  }

  selectWorkspace(id: string): void { this.facade.selectWorkspace(id); }
}
