import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SecurityFacade } from '../../application/security.facade';
import { LanguageService } from '../../../../core/i18n/language.service';
import { SupportedLanguage } from '../../../../core/i18n/supported-language';
import { BrandLogoComponent } from '../../../../shared/presentation/components/brand-logo/brand-logo.component';

type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

const TOTAL_STEPS = 6;

@Component({ selector: 'nexa-organization-onboarding-page', imports: [BrandLogoComponent, ReactiveFormsModule, RouterLink, TranslatePipe], templateUrl: './organization-onboarding-page.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class OrganizationOnboardingPageComponent {
  readonly facade = inject(SecurityFacade);
  private readonly router = inject(Router);
  readonly languageService = inject(LanguageService);
  readonly currentStep = signal<OnboardingStep>(1);
  readonly steps = [
    { id: 1, key: 'organization' },
    { id: 2, key: 'operation' },
    { id: 3, key: 'administrator' },
    { id: 4, key: 'workspace' },
    { id: 5, key: 'plan' },
    { id: 6, key: 'review' },
  ] as const;
  readonly plans = ['Starter', 'Standard', 'Professional', 'Enterprise'] as const;
  readonly form = new FormGroup({
    legalName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    operationCategory: new FormControl('b2bColdChainDistributor', { nonNullable: true, validators: [Validators.required] }),
    storageSiteName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    storageSiteAddress: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    founderEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    founderDisplayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    workspaceName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    workspaceSlug: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern('[A-Za-z0-9-]{3,80}') ] }),
    referencePlan: new FormControl('Starter', { nonNullable: true, validators: [Validators.required] }),
    termsVersion: new FormControl('v1', { nonNullable: true, validators: [Validators.required] }),
    termsAccepted: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] })
  });

  setLanguage(language: SupportedLanguage): void { this.languageService.setLanguage(language); }

  stepLabelKey(step: (typeof this.steps)[number]): string { return `iamSecurity.onboarding.steps.${step.key}`; }
  stepTitleKey(step: OnboardingStep): string { return `iamSecurity.onboarding.titles.${this.steps[step - 1].key}`; }
  stepDescriptionKey(step: OnboardingStep): string { return `iamSecurity.onboarding.descriptions.${this.steps[step - 1].key}`; }
  showError(control: AbstractControl): boolean { return control.touched && control.invalid; }
  isComplete(step: OnboardingStep): boolean { return step < this.currentStep(); }

  goToStep(step: OnboardingStep): void {
    if (step <= this.currentStep()) this.currentStep.set(step);
  }

  previous(): void {
    if (this.currentStep() > 1) this.currentStep.update((step) => (step - 1) as OnboardingStep);
  }

  next(): void {
    if (!this.validateStep(this.currentStep())) return;
    if (this.currentStep() < TOTAL_STEPS) this.currentStep.update((step) => (step + 1) as OnboardingStep);
  }

  submit(): void {
    if (this.currentStep() !== TOTAL_STEPS) { this.next(); return; }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.facade.register({ ...this.form.getRawValue(), businessIdentifier: null }).subscribe((result) => this.router.navigate(['/tenant-management/registration-pending', result.registrationId], { queryParams: { statusToken: result.statusToken } }));
  }

  operationLabelKey(value: string): string {
    const keys: Record<string, string> = {
      b2bColdChainDistributor: 'iamSecurityOperationOptions.distributor',
      refrigeratedWarehouseOperator: 'iamSecurityOperationOptions.warehouse',
      foodServiceSupplier: 'iamSecurityOperationOptions.foodService',
      thirdPartyColdStorage: 'iamSecurityOperationOptions.thirdPartyStorage',
    };
    return keys[value] ?? keys['b2bColdChainDistributor'];
  }

  planLabelKey(value: string): string { return `iamSecurityPlanOptions.${value.toLowerCase()}`; }

  private validateStep(step: OnboardingStep): boolean {
    const controls = this.controlsForStep(step);
    controls.forEach((control) => control.markAsTouched());
    return controls.every((control) => control.valid);
  }

  private controlsForStep(step: OnboardingStep): readonly AbstractControl[] {
    switch (step) {
      case 1: return [this.form.controls.legalName, this.form.controls.displayName];
      case 2: return [this.form.controls.operationCategory, this.form.controls.storageSiteName, this.form.controls.storageSiteAddress];
      case 3: return [this.form.controls.founderDisplayName, this.form.controls.founderEmail];
      case 4: return [this.form.controls.workspaceName, this.form.controls.workspaceSlug];
      case 5: return [this.form.controls.referencePlan];
      case 6: return [this.form.controls.termsAccepted];
    }
  }
}
