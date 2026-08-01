import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SecurityMode } from '../../domain/security.models';
import { SecurityFacade } from '../../application/security.facade';

@Component({
  selector: 'nexa-security-page',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, DatePipe],
  templateUrl: './security-page.component.html',
  styleUrl: './security-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SecurityPageComponent {
  readonly facade = inject(SecurityFacade);
  private readonly router = inject(Router);
  readonly mode = inject(ActivatedRoute).snapshot.data['mode'] as SecurityMode;
  readonly profileForm = new FormGroup({ displayName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }), phone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(64)] }), preferredLanguage: new FormControl('es', { nonNullable: true, validators: [Validators.required] }), timezone: new FormControl('America/Lima', { nonNullable: true, validators: [Validators.required] }) });
  readonly passwordForm = new FormGroup({ currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }), newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(12), Validators.maxLength(128)] }) });
  readonly resetRequestForm = new FormGroup({ email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }) });
  readonly resetForm = new FormGroup({ token: new FormControl(inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '', { nonNullable: true, validators: [Validators.required] }), newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(12), Validators.maxLength(128)] }) });
  readonly registrationForm = new FormGroup({ legalName: new FormControl('', { nonNullable: true, validators: [Validators.required] }), displayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }), operationCategory: new FormControl('b2bColdChainDistributor', { nonNullable: true, validators: [Validators.required] }), storageSiteName: new FormControl('', { nonNullable: true, validators: [Validators.required] }), storageSiteAddress: new FormControl('', { nonNullable: true, validators: [Validators.required] }), founderEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }), founderDisplayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }), workspaceName: new FormControl('', { nonNullable: true, validators: [Validators.required] }), workspaceSlug: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern('[A-Za-z0-9-]{3,80}') ] }), referencePlan: new FormControl('Starter', { nonNullable: true, validators: [Validators.required] }), termsVersion: new FormControl('v1', { nonNullable: true }), termsAccepted: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }) });
  private loaded = false;
  constructor() { if (this.mode === 'profile') this.loadProfile(); if (this.mode === 'sessions') this.facade.loadSessions().subscribe(); const id = inject(ActivatedRoute).snapshot.paramMap.get('registrationId'); if (this.mode === 'pending' && id) this.facade.loadRegistration(id).subscribe(); }
  submit(): void {
    this.facade.clearMessages();
    if (this.mode === 'forgot' && this.resetRequestForm.valid) this.facade.requestReset(this.resetRequestForm.controls.email.value).subscribe();
    if (this.mode === 'reset' && this.resetForm.valid) this.facade.resetPassword(this.resetForm.controls.token.value, this.resetForm.controls.newPassword.value).subscribe();
    if (this.mode === 'password' && this.passwordForm.valid) this.facade.changePassword(this.passwordForm.controls.currentPassword.value, this.passwordForm.controls.newPassword.value).subscribe();
    if (this.mode === 'profile' && this.profileForm.valid && this.facade.profile()) this.facade.saveProfile(this.profileForm.getRawValue(), this.facade.profile()!.version).subscribe();
    if (this.mode === 'onboarding' && this.registrationForm.valid) this.facade.register({ ...this.registrationForm.getRawValue(), businessIdentifier: null }).subscribe((result) => this.router.navigate(['/tenant-management/registration-pending', result.registrationId]));
  }
  private loadProfile(): void { this.facade.loadProfile().subscribe((value) => { if (this.loaded) return; this.loaded = true; this.profileForm.patchValue({ displayName: value.displayName, phone: value.phone ?? '', preferredLanguage: value.preferredLanguage, timezone: value.timezone }); }); }
}
