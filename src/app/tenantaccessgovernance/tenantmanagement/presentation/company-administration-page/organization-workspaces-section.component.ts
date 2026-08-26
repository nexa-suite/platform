import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CompanyAdministrationFacade } from '../../application/company-administration.facade';
import { WorkspaceSummary } from '../../domain/models/company-administration.models';
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
  readonly workspaceEditForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), Validators.maxLength(64)]]
  });
  editingWorkspaceId: string | null = null;
  readonly pendingWorkspaceLifecycle = signal<{ readonly workspace: WorkspaceSummary; readonly action: 'suspend' | 'reactivate' } | null>(null);
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
    if (!this.facade.canManageOrganization() || this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.facade.updateOrganization({ ...this.profileForm.getRawValue(), businessIdentifier: this.profileForm.controls.businessIdentifier.value || null }, this.profileVersion);
  }

  editWorkspace(id: string): void {
    this.editingWorkspaceId = id;
    this.workspaceVersion = -1;
  }

  cancelEdit(): void { this.editingWorkspaceId = null; this.workspaceVersion = -1; }

  saveWorkspace(): void {
    if (!this.facade.canManageWorkspace() || !this.editingWorkspaceId || this.workspaceEditForm.invalid) { this.workspaceEditForm.markAllAsTouched(); return; }
    this.facade.renameWorkspace(this.editingWorkspaceId, this.workspaceVersion, this.workspaceEditForm.controls.name.value, this.workspaceEditForm.controls.slug.value);
    this.cancelEdit();
  }

  toggleWorkspace(workspace: { readonly id: string; readonly version: number; readonly status: string }): void {
	this.requestWorkspaceLifecycle(workspace as WorkspaceSummary);
  }

  requestWorkspaceLifecycle(workspace: WorkspaceSummary): void {
    if (!this.facade.canManageWorkspace()) return;
    this.pendingWorkspaceLifecycle.set({ workspace, action: workspace.status === 'ACTIVE' ? 'suspend' : 'reactivate' });
  }

  confirmWorkspaceLifecycle(): void {
    const pending = this.pendingWorkspaceLifecycle();
    if (!pending || !this.facade.canManageWorkspace()) return;
    this.pendingWorkspaceLifecycle.set(null);
    if (pending.action === 'suspend') this.facade.suspendWorkspace(pending.workspace.id, pending.workspace.version);
    else this.facade.reactivateWorkspace(pending.workspace.id, pending.workspace.version);
  }

  cancelWorkspaceLifecycle(): void {
    this.pendingWorkspaceLifecycle.set(null);
  }

  selectWorkspace(id: string): void { this.facade.selectWorkspace(id); }
}
