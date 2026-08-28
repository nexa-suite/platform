import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, timeout } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthenticationService } from '../../application/authentication.service';
import { SignInCommand, WorkspacePreview } from '../../domain/models/auth.models';
import { safeReturnUrl } from '../../../../core/routing/route-paths';
import { LanguageService } from '../../../../core/i18n/language.service';
import { SupportedLanguage } from '../../../../core/i18n/supported-language';
import { BrandLogoComponent } from '../../../../shared/presentation/components/brand-logo/brand-logo.component';
import { NexaIconComponent } from '../../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PLATFORM_RUNTIME_CONFIG } from '../../../../core/security/runtime-config';

export type WorkspacePreviewErrorCode = 'notFound' | 'origin' | 'rateLimited' | 'server' | 'network' | 'timeout' | 'invalid';

export function classifyWorkspacePreviewError(error: unknown): WorkspacePreviewErrorCode {
  if (error && typeof error === 'object' && 'name' in error && error.name === 'TimeoutError') return 'timeout';
  if (error instanceof HttpErrorResponse) {
    if (error.status === 404) return 'notFound';
    if (error.status === 403) return 'origin';
    if (error.status === 429) return 'rateLimited';
    if (error.status >= 500) return 'server';
    if (error.status === 0) return 'network';
    return 'invalid';
  }
  return 'network';
}

@Component({
  selector: 'nexa-sign-in-page',
  imports: [BrandLogoComponent, FormField, NexaIconComponent, RouterLink, TranslatePipe],
  templateUrl: './sign-in-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignInPageComponent {
  private readonly authentication = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly runtimeConfig = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly destroyRef = inject(DestroyRef);
  private readonly previewInput = new Subject<string>();
  readonly languageService = inject(LanguageService);

  readonly model = signal<SignInCommand>({ identifier: '', password: '', workspaceSlug: this.runtimeConfig.dataMode === 'mock' ? this.runtimeConfig.tenantProfile : '' });
  readonly signInForm = form(this.model, (schemaPath) => {
    required(schemaPath.identifier, { message: 'Identifier is required' });
    required(schemaPath.password, { message: 'Password is required' });
    minLength(schemaPath.password, 8, { message: 'Password must contain at least 8 characters' });
    required(schemaPath.workspaceSlug, { message: 'Workspace is required' });
  });
  readonly status = this.authentication.status;
  readonly state = this.authentication.state;
  readonly twoFactorChallenge = this.authentication.twoFactorChallenge;
  readonly returnUrl = computed(() => safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')));
  readonly preview = signal<WorkspacePreview | null>(null);
  readonly previewLoading = signal(false);
  readonly previewError = signal<WorkspacePreviewErrorCode | null>(null);
  readonly twoFactorCode = signal('');
  readonly passwordVisible = signal(false);
  readonly validationError = signal<string | null>(null);
  readonly formErrorMessage = computed(() => this.validationError() ?? (this.status() === 'error' ? 'auth.signIn.error' : null));
  readonly twoFactorCanSubmit = computed(() => /^\d{6}$/.test(this.twoFactorCode().trim()) && this.status() !== 'verifying-two-factor');

  constructor() {
    this.previewInput.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((slug) => {
        this.previewError.set(null);
        this.previewLoading.set(slug.length > 0);
        if (slug.length < 3) return of({ kind: 'value' as const, value: null });
        return this.authentication.workspacePreview(slug).pipe(
          timeout({ first: 5000 }),
          map((value) => ({ kind: 'value' as const, value })),
          catchError((error: unknown) => of({ kind: 'error' as const, error })),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      this.previewLoading.set(false);
      if (result.kind === 'error') {
        this.preview.set(null);
        this.previewError.set(classifyWorkspacePreviewError(result.error));
        return;
      }
      this.preview.set(result.value);
    });
    this.previewInput.next(this.model().workspaceSlug);
  }

  readonly canSubmit = computed(() =>
    !this.signInForm().invalid() &&
    this.preview()?.recognized === true &&
    this.preview()?.loginAvailable === true &&
    !this.previewLoading() &&
    this.status() !== 'authenticating',
  );

  onWorkspaceInput(event: Event): void {
    const value = event.target instanceof HTMLInputElement ? event.target.value : '';
    const normalized = value.trim().toLowerCase();
    this.validationError.set(null);
    this.preview.set(null);
    this.previewError.set(null);
    this.previewInput.next(normalized);
  }

  submit(event: Event): void {
    event.preventDefault();
    if (this.status() === 'two-factor-challenge') {
      this.submitTwoFactor();
      return;
    }
    this.validationError.set(null);
    if (this.status() === 'authenticating') return;

    const workspaceSlug = this.model().workspaceSlug.trim().toLowerCase();
    if (!workspaceSlug || !this.model().identifier.trim() || !this.model().password) {
      this.validationError.set('auth.signIn.required');
      return;
    }
    if (this.previewLoading()) {
      this.validationError.set('auth.signIn.workspacePreview.loading');
      return;
    }
    if (this.preview()?.recognized !== true || this.preview()?.loginAvailable !== true) {
      this.validationError.set('auth.signIn.workspacePreview.notFound');
      return;
    }

    this.authentication.signIn(this.model()).subscribe({
      next: (user) => { if (user) void this.router.navigateByUrl(this.returnUrl()); },
      error: () => undefined
    });
  }

  onTwoFactorInput(event: Event): void {
    const value = event.target instanceof HTMLInputElement ? event.target.value : '';
    this.twoFactorCode.set(value.replace(/\D/g, '').slice(0, 6));
  }

  togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  submitTwoFactor(): void {
    if (!this.twoFactorCanSubmit()) return;
    this.authentication.verifyTwoFactor(this.twoFactorCode()).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl()),
      error: () => undefined,
    });
  }

  cancelTwoFactor(): void {
    this.twoFactorCode.set('');
    this.authentication.cancelTwoFactor();
  }

  setLanguage(language: SupportedLanguage): void {
    this.languageService.setLanguage(language);
  }
}
