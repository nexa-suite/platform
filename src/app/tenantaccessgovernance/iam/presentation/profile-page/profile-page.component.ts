import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NexaIconComponent } from '../../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { ErrorStateComponent } from '../../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../../shared/presentation/components/page-header/page-header.component';
import { PLATFORM_NAVIGATION_GROUPS } from '../../../../core/navigation/navigation.registry';
import { PlatformAuthenticationBoundary } from '../../../../core/security/platform-authentication.boundary';
import { SecurityFacade } from '../../application/security.facade';

@Component({
  selector: 'nexa-profile-page',
  imports: [ErrorStateComponent, LoadingStateComponent, NexaIconComponent, PageHeaderComponent, ReactiveFormsModule, TranslatePipe],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePageComponent {
  readonly facade = inject(SecurityFacade);
  private readonly authentication = inject(PlatformAuthenticationBoundary);
  private readonly router = inject(Router);
  readonly currentUser = this.authentication.currentUser;
  readonly profile = this.facade.profile;
  readonly editingAccount = signal(false);
  readonly editingPreferences = signal(false);
  readonly form = new FormGroup({ displayName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }), phone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(64)] }), preferredLanguage: new FormControl('es', { nonNullable: true, validators: [Validators.required] }), timezone: new FormControl('America/Lima', { nonNullable: true, validators: [Validators.required] }) });
  readonly primaryRole = computed(() => {
    const roles = this.currentUser()?.roles ?? [];
    if (roles.includes('COMPANY_OWNER')) return 'COMPANY_OWNER' as const;
    if (roles.includes('TENANT_ADMIN')) return 'TENANT_ADMIN' as const;
    if (roles.includes('LOGISTICS')) return 'LOGISTICS' as const;
    if (roles.includes('WAREHOUSE')) return 'WAREHOUSE' as const;
    if (roles.includes('SALES')) return 'SALES' as const;
    return null;
  });
  readonly roleLabelKey = computed(() => this.primaryRole() ? `shell.roles.${this.primaryRole()}` : null);
  readonly rawRoleLabel = computed(() => this.currentUser()?.roleCodes?.[0] ?? this.currentUser()?.roles?.[0] ?? '');
  readonly workspaceSlug = computed(() => this.currentUser()?.workspaceSlug ?? '');
  readonly workspaceUrl = computed(() => this.workspaceSlug() ? `${this.workspaceSlug()}.nexa.com.pe` : '');
  readonly workspaceName = computed(() => this.workspaceSlug().toLowerCase() === 'icisa' ? 'ICISA Distribuciones' : this.workspaceSlug() || 'Nexa');
  readonly initials = computed(() => {
    const value = (this.profile()?.displayName || this.currentUser()?.displayName || 'Nexa').trim();
    const parts = value.split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : value.slice(0, 2)).toUpperCase();
  });
  readonly operationalScope = computed(() => {
    const seen = new Set<string>();
    return PLATFORM_NAVIGATION_GROUPS
      .flatMap((group) => group.items)
      .filter((item) => this.authentication.hasPermission(item.permission))
      .filter((item) => !item.path.endsWith('/dashboard') && !seen.has(item.labelKey) && seen.add(item.labelKey))
      .map((item) => ({ labelKey: item.labelKey, icon: item.icon }));
  });

  constructor() { this.load(); }

  load(): void {
    this.facade.loadProfile().subscribe({
      next: (value) => this.form.patchValue({ displayName: value.displayName, phone: value.phone ?? '', preferredLanguage: value.preferredLanguage, timezone: value.timezone }),
      error: () => undefined
    });
  }

  submit(): void {
    const profile = this.facade.profile();
    if (this.form.valid && profile) {
      this.facade.saveProfile(this.form.getRawValue(), profile.version).subscribe({
        next: () => { this.editingAccount.set(false); this.editingPreferences.set(false); },
        error: () => undefined
      });
    }
  }

  cancelEdit(): void {
    const profile = this.facade.profile();
    if (profile) this.form.patchValue({ displayName: profile.displayName, phone: profile.phone ?? '', preferredLanguage: profile.preferredLanguage, timezone: profile.timezone });
    this.editingAccount.set(false);
    this.editingPreferences.set(false);
  }

  switchAccount(): void {
    this.authentication.signOut().subscribe({ complete: () => void this.router.navigateByUrl('/sign-in', { replaceUrl: true }) });
  }
}
