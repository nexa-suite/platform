import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { SecurityFacade } from '../../application/security.facade';

@Component({ selector: 'nexa-change-password-page', imports: [ReactiveFormsModule, TranslatePipe], templateUrl: './change-password-page.component.html', styleUrl: '../security-page/security-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class ChangePasswordPageComponent {
  readonly facade = inject(SecurityFacade);
  readonly form = new FormGroup({ currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }), newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(12), Validators.maxLength(128)] }) });
  submit(): void { if (this.form.valid) this.facade.changePassword(this.form.controls.currentPassword.value, this.form.controls.newPassword.value).subscribe(); }
}
