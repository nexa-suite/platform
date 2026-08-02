import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { SecurityFacade } from '../../application/security.facade';

@Component({ selector: 'nexa-profile-page', imports: [ReactiveFormsModule, TranslatePipe], templateUrl: './profile-page.component.html', styleUrl: '../security-page/security-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class ProfilePageComponent {
  readonly facade = inject(SecurityFacade);
  readonly form = new FormGroup({ displayName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }), phone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(64)] }), preferredLanguage: new FormControl('es', { nonNullable: true, validators: [Validators.required] }), timezone: new FormControl('America/Lima', { nonNullable: true, validators: [Validators.required] }) });
  private loaded = false;
  constructor() { this.facade.loadProfile().subscribe((value) => { if (this.loaded) return; this.loaded = true; this.form.patchValue({ displayName: value.displayName, phone: value.phone ?? '', preferredLanguage: value.preferredLanguage, timezone: value.timezone }); }); }
  submit(): void { const profile = this.facade.profile(); if (this.form.valid && profile) this.facade.saveProfile(this.form.getRawValue(), profile.version).subscribe(); }
}
