import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationService } from '../../application/authentication.service';
import { SignInCommand } from '../../domain/models/auth.models';
import { safeReturnUrl } from '../../../core/routing/route-paths';

@Component({
  selector: 'nexa-sign-in-page',
  imports: [FormField, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, TranslatePipe],
  templateUrl: './sign-in-page.component.html',
  styleUrl: './sign-in-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignInPageComponent {
  private readonly authentication = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly model = signal<SignInCommand>({ identifier: '', password: '', workspaceSlug: '' });
  readonly signInForm = form(this.model, (schemaPath) => {
    required(schemaPath.identifier, { message: 'Identifier is required' });
    required(schemaPath.password, { message: 'Password is required' });
    minLength(schemaPath.password, 8, { message: 'Password must contain at least 8 characters' });
    required(schemaPath.workspaceSlug, { message: 'Workspace is required' });
  });
  readonly status = this.authentication.status;
  readonly returnUrl = computed(() => safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')));
  readonly passwordVisible = signal(false);

  submit(event: Event): void {
    event.preventDefault();
    if (this.signInForm().invalid()) return;
    this.authentication.signIn(this.model()).subscribe({
      next: () => { void this.router.navigateByUrl(this.returnUrl()); },
      error: () => undefined
    });
  }
}
