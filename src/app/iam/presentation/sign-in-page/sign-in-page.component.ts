import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationService } from '../../application/authentication.service';
import { SignInCommand } from '../../domain/models/auth.models';
import { safeReturnUrl } from '../../../core/routing/route-paths';
import { LanguageService } from '../../../core/i18n/language.service';
import { SupportedLanguage } from '../../../core/i18n/supported-language';
import { BrandLogoComponent } from '../../../shared/presentation/components/brand-logo/brand-logo.component';

@Component({
  selector: 'nexa-sign-in-page',
  imports: [BrandLogoComponent, FormField, RouterLink, TranslatePipe],
  templateUrl: './sign-in-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignInPageComponent {
  private readonly authentication = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly languageService = inject(LanguageService);

  readonly model = signal<SignInCommand>({ identifier: '', password: '', workspaceSlug: '' });
  readonly signInForm = form(this.model, (schemaPath) => {
    required(schemaPath.identifier, { message: 'Identifier is required' });
    required(schemaPath.password, { message: 'Password is required' });
    minLength(schemaPath.password, 8, { message: 'Password must contain at least 8 characters' });
    required(schemaPath.workspaceSlug, { message: 'Workspace is required' });
  });
  readonly status = this.authentication.status;
  readonly returnUrl = computed(() => safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')));

  submit(event: Event): void {
    event.preventDefault();
    if (this.signInForm().invalid()) {
      this.signInForm.workspaceSlug().markAsTouched();
      this.signInForm.identifier().markAsTouched();
      this.signInForm.password().markAsTouched();
      return;
    }
    this.authentication.signIn(this.model()).subscribe({
      next: () => { void this.router.navigateByUrl(this.returnUrl()); },
      error: () => undefined
    });
  }

  setLanguage(language: SupportedLanguage): void {
    this.languageService.setLanguage(language);
  }
}
