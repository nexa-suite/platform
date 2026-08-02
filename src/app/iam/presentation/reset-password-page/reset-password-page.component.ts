import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SecurityFacade } from '../../application/security.facade';

@Component({ selector: 'nexa-reset-password-page', imports: [ReactiveFormsModule, RouterLink, TranslatePipe], templateUrl: './reset-password-page.component.html', styleUrl: '../security-page/security-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class ResetPasswordPageComponent {
  readonly facade = inject(SecurityFacade);
  readonly form = new FormGroup({ token: new FormControl(inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '', { nonNullable: true, validators: [Validators.required] }), newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(12), Validators.maxLength(128)] }) });
  submit(): void { if (this.form.valid) this.facade.resetPassword(this.form.controls.token.value, this.form.controls.newPassword.value).subscribe(); }
}
