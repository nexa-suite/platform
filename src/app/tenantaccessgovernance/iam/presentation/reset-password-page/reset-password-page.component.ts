import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SecurityFacade } from '../../application/security.facade';

@Component({ selector: 'nexa-reset-password-page', imports: [ReactiveFormsModule, RouterLink, TranslatePipe], templateUrl: './reset-password-page.component.html', styleUrl: '../security-page/security-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class ResetPasswordPageComponent {
  readonly facade = inject(SecurityFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly form = new FormGroup({ token: new FormControl(this.route.snapshot.queryParamMap.get('token') ?? '', { nonNullable: true, validators: [Validators.required] }), newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(12), Validators.maxLength(128)] }) });
  constructor() { if (this.form.controls.token.value) void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true }); }
  submit(): void { if (this.form.valid) this.facade.resetPassword(this.form.controls.token.value, this.form.controls.newPassword.value).subscribe(); }
}
