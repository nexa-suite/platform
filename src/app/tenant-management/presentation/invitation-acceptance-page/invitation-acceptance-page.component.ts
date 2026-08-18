import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvitationAcceptanceFacade } from '../../application/invitation-acceptance.facade';
import { TenantAdministrationI18n } from '../i18n/tenant-administration-i18n.service';

type AccountMode = 'new' | 'existing';

@Component({
  selector: 'nexa-invitation-acceptance-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './invitation-acceptance-page.component.html',
  styleUrl: './invitation-acceptance-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvitationAcceptancePageComponent {
  readonly facade = inject(InvitationAcceptanceFacade);
  readonly i18n = inject(TenantAdministrationI18n);
  readonly mode = signal<AccountMode>('new');
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly form = this.fb.group({
    token: [this.route.snapshot.queryParamMap.get('token') ?? '', Validators.required],
    displayName: ['', [Validators.maxLength(160)]],
    password: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(128)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: (control) => this.passwordsMatch(control) });

  constructor() {
    this.setMode('new');
    this.scrubTokenFromUrl();
  }

  setMode(mode: AccountMode): void {
    this.mode.set(mode);
    const displayName = this.form.controls.displayName;
    const confirmation = this.form.controls.confirmPassword;
    if (mode === 'new') {
      displayName.setValidators([Validators.required, Validators.maxLength(160)]);
      confirmation.setValidators([Validators.required]);
    } else {
      displayName.clearValidators();
      confirmation.clearValidators();
    }
    displayName.updateValueAndValidity();
    confirmation.updateValueAndValidity();
    this.form.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.facade.accept({
      token: value.token.trim(),
      password: value.password,
      displayName: value.displayName.trim() || null
    }).subscribe();
  }

  passwordMismatch(): boolean { return this.mode() === 'new' && this.form.hasError('passwordMismatch') && this.form.controls.confirmPassword.touched; }
  roleNames(roles: readonly string[]): string { return roles.map((role) => this.i18n.role(role)).join(', '); }

  private passwordsMatch(control: AbstractControl): ValidationErrors | null {
    if (this.mode() !== 'new') return null;
    return control.get('password')?.value === control.get('confirmPassword')?.value ? null : { passwordMismatch: true };
  }

  private scrubTokenFromUrl(): void {
    if (!this.form.controls.token.value) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { token: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
