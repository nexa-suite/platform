import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SecurityFacade } from '../../application/security.facade';

@Component({ selector: 'nexa-organization-onboarding-page', imports: [ReactiveFormsModule, TranslatePipe], templateUrl: './organization-onboarding-page.component.html', styleUrl: '../security-page/security-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class OrganizationOnboardingPageComponent {
  readonly facade = inject(SecurityFacade);
  private readonly router = inject(Router);
  readonly form = new FormGroup({ legalName: new FormControl('', { nonNullable: true, validators: [Validators.required] }), displayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }), operationCategory: new FormControl('b2bColdChainDistributor', { nonNullable: true, validators: [Validators.required] }), storageSiteName: new FormControl('', { nonNullable: true, validators: [Validators.required] }), storageSiteAddress: new FormControl('', { nonNullable: true, validators: [Validators.required] }), founderEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }), founderDisplayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }), workspaceName: new FormControl('', { nonNullable: true, validators: [Validators.required] }), workspaceSlug: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern('[A-Za-z0-9-]{3,80}') ] }), referencePlan: new FormControl('Starter', { nonNullable: true, validators: [Validators.required] }), termsVersion: new FormControl('v1', { nonNullable: true, validators: [Validators.required] }), termsAccepted: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }) });
  submit(): void { if (this.form.valid) this.facade.register({ ...this.form.getRawValue(), businessIdentifier: null }).subscribe((result) => this.router.navigate(['/tenant-management/registration-pending', result.registrationId], { queryParams: { statusToken: result.statusToken } })); }
}
