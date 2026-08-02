import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SecurityFacade } from '../../application/security.facade';

@Component({ selector: 'nexa-forgot-password-page', imports: [ReactiveFormsModule, RouterLink, TranslatePipe], templateUrl: './forgot-password-page.component.html', styleUrl: '../security-page/security-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class ForgotPasswordPageComponent {
  readonly facade = inject(SecurityFacade);
  readonly form = new FormGroup({ email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }) });
  submit(): void { if (this.form.valid) this.facade.requestReset(this.form.controls.email.value).subscribe(); }
}
