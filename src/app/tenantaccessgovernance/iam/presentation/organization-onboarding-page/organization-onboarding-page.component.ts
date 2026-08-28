import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SecurityFacade } from '../../application/security.facade';
import { LanguageService } from '../../../../core/i18n/language.service';
import { SupportedLanguage } from '../../../../core/i18n/supported-language';
import { BrandLogoComponent } from '../../../../shared/presentation/components/brand-logo/brand-logo.component';

type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

const TOTAL_STEPS = 6;
const PERSONAL_EMAIL_DOMAINS = new Set(['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com']);

function businessEmail(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim().toLowerCase();
  if (!value || Validators.email(control)) return null;
  const domain = value.split('@').at(-1) ?? '';
  return PERSONAL_EMAIL_DOMAINS.has(domain) ? { personalEmail: true } : null;
}

function categoriesRequired(control: AbstractControl): ValidationErrors | null {
  return Array.isArray(control.value) && control.value.length > 0 ? null : { required: true };
}

@Component({
  selector: 'nexa-organization-onboarding-page',
  imports: [BrandLogoComponent, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './organization-onboarding-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationOnboardingPageComponent {
  readonly facade = inject(SecurityFacade);
  private readonly router = inject(Router);
  readonly languageService = inject(LanguageService);

  readonly currentStep = signal<OnboardingStep>(1);
  readonly logoError = signal<string | null>(null);
  readonly temperatureRangeError = signal(false);
  readonly taxIdError = signal(false);
  readonly steps = [
    { id: 1, key: 'organization' },
    { id: 2, key: 'operation' },
    { id: 3, key: 'location' },
    { id: 4, key: 'administrator' },
    { id: 5, key: 'workspace' },
    { id: 6, key: 'review' },
  ] as const;

  readonly industrySectors = ['coldChainDistribution', 'refrigeratedStorage', 'frozenFoodDistribution', 'foodServiceSupplier', 'hospitalitySupplier', 'retailDistribution', 'seafoodMeatLogistics', 'thirdPartyColdStorage', 'mixedColdChain'] as const;
  readonly countries = ['peru', 'chile', 'colombia', 'ecuador', 'bolivia', 'brazil', 'argentina', 'mexico', 'unitedStates', 'canada', 'spain', 'uruguay', 'paraguay', 'panama', 'costaRica', 'guatemala', 'dominicanRepublic'] as const;
  readonly operationTypes = ['b2bColdChainDistributor', 'refrigeratedWarehouseOperator', 'foodServiceSupplier', 'thirdPartyColdStorage'] as const;
  readonly volumeRanges = ['lt50', '50to200', '200to500', '500to2000', 'gt2000'] as const;
  readonly deliveryCoverages = ['limaMetropolitana', 'callao', 'limaCallao', 'limaNorthCallao', 'limaSouthCallao', 'regionalPeru'] as const;
  readonly productCategories = ['dairy', 'meat', 'frozenFoods', 'freshProduce', 'seafood', 'gourmet'] as const;
  readonly cities = ['lima', 'callao', 'arequipa', 'trujillo', 'chiclayo', 'piura'] as const;
  readonly districts = ['losOlivos', 'sanIsidro', 'miraflores', 'ate', 'villaElSalvador', 'lurin', 'cercadoDeLima', 'callao', 'bellavista', 'laPerla', 'ventanilla'] as const;
  readonly capacities = ['lt100Pallets', '100to500Pallets', '500to2000Pallets', 'gt2000Pallets'] as const;
  readonly phonePrefixes = ['+51', '+56', '+57', '+593', '+591', '+55', '+54', '+52', '+1'] as const;
  readonly plans = ['Starter', 'Standard', 'Professional', 'Enterprise'] as const;
  private readonly planCapabilityMap: Record<string, readonly string[]> = {
    Starter: ['catalog', 'requests', 'warehouse'],
    Standard: ['catalog', 'requests', 'warehouse', 'inventory', 'logistics', 'buyerPortal'],
    Professional: ['catalog', 'requests', 'warehouse', 'inventory', 'logistics', 'buyerPortal', 'analytics'],
    Enterprise: ['catalog', 'requests', 'warehouse', 'inventory', 'logistics', 'buyerPortal', 'analytics', 'custom'],
  };

  readonly form = new FormGroup({
    legalName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    businessIdentifier: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    industrySector: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    companyMemberCount: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(100)] }),
    country: new FormControl('peru', { nonNullable: true, validators: [Validators.required] }),
    website: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^https?:\/\/.+\..+/i)] }),
    logoFileName: new FormControl('', { nonNullable: true }),

    operationType: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    monthlyVolume: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    deliveryCoverage: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    minTemperature: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(-30), Validators.max(20)] }),
    maxTemperature: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(-30), Validators.max(20)] }),
    categories: new FormControl<string[]>([], { nonNullable: true, validators: [categoriesRequired] }),
    refrigeratedStorage: new FormControl(false, { nonNullable: true }),
    requiresTraceability: new FormControl(false, { nonNullable: true }),
    requiresTemperatureAlerts: new FormControl(false, { nonNullable: true }),

    storageSiteName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    storageSiteAddress: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    district: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    locationCountry: new FormControl('peru', { nonNullable: true, validators: [Validators.required] }),
    locationReference: new FormControl('', { nonNullable: true }),
    warehouseCount: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1), Validators.max(10)] }),
    coldRoomsCount: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0), Validators.max(50)] }),
    capacityEstimate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    fefoEnabled: new FormControl(false, { nonNullable: true }),

    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    jobTitle: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    founderEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, businessEmail] }),
    phonePrefix: new FormControl('+51', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\+?[\d\s-]{7,18}$/)] }),
    preferredLanguage: new FormControl<SupportedLanguage>('es', { nonNullable: true, validators: [Validators.required] }),
    roleAfterApproval: new FormControl({ value: 'CompanyOwner', disabled: true }, { nonNullable: true }),

    workspaceName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    workspaceSlug: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{3,80}$/)] }),
    workspaceDisplayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    emailDomain: new FormControl('', { nonNullable: true }),
    referencePlan: new FormControl('Starter', { nonNullable: true, validators: [Validators.required] }),
    termsVersion: new FormControl('v1', { nonNullable: true, validators: [Validators.required] }),
    termsAccepted: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  setLanguage(language: SupportedLanguage): void { this.languageService.setLanguage(language); }

  stepLabelKey(step: (typeof this.steps)[number]): string { return `iamSecurity.onboarding.steps.${step.key}`; }
  stepTitleKey(step: OnboardingStep): string { return `iamSecurity.onboarding.titles.${this.steps[step - 1].key}`; }
  stepDescriptionKey(step: OnboardingStep): string { return `iamSecurity.onboarding.descriptions.${this.steps[step - 1].key}`; }
  optionKey(value: string): string { return `iamSecurity.onboarding.options.${value}`; }
  planLabelKey(value: string): string { return `iamSecurityPlanOptions.${value.toLowerCase()}`; }
  showError(control: AbstractControl): boolean { return control.touched && control.invalid; }
  isComplete(step: OnboardingStep): boolean { return step < this.currentStep(); }
  workspaceUrl(): string { return `${this.form.controls.workspaceSlug.value.trim() || 'workspace'}.nexa.com.pe`; }
  companySizeKey(): string {
    const count = this.form.controls.companyMemberCount.value;
    return count <= 10 ? '1to10' : count <= 25 ? '11to25' : count <= 50 ? '26to50' : '51to100';
  }
  emailDomain(): string {
    const website = this.form.controls.website.value.trim();
    try { return website ? new URL(website).hostname.replace(/^www\./, '').toLowerCase() : ''; } catch { return ''; }
  }
  planCapabilities(plan: string): readonly string[] { return this.planCapabilityMap[plan] ?? []; }

  goToStep(step: OnboardingStep): void { if (step <= this.currentStep()) this.currentStep.set(step); }
  previous(): void { if (this.currentStep() > 1) this.currentStep.update((step) => (step - 1) as OnboardingStep); }

  next(): void {
    if (!this.validateStep(this.currentStep())) return;
    if (this.currentStep() < TOTAL_STEPS) this.currentStep.update((step) => (step + 1) as OnboardingStep);
  }

  toggleCategory(category: string, event: Event): void {
    const checked = event.target instanceof HTMLInputElement && event.target.checked;
    const current = this.form.controls.categories.value;
    const next = checked ? [...new Set([...current, category])] : current.filter((value) => value !== category);
    this.form.controls.categories.setValue(next);
    this.form.controls.categories.markAsDirty();
    this.form.controls.categories.updateValueAndValidity();
  }

  onLogoSelected(event: Event): void {
    const file = event.target instanceof HTMLInputElement ? fileFromInput(event.target) : null;
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.logoError.set('iamSecurity.onboarding.logoSize');
      this.form.controls.logoFileName.setValue('');
      return;
    }
    this.logoError.set(null);
    this.form.controls.logoFileName.setValue(file.name);
  }

  deriveWorkspaceSlug(): void {
    const slug = this.form.controls.workspaceSlug;
    if (slug.dirty && slug.value.trim()) return;
    slug.setValue(this.slugify(this.form.controls.workspaceName.value), { emitEvent: false });
  }

  normalizeWorkspaceSlug(): void {
    const slug = this.form.controls.workspaceSlug;
    slug.setValue(this.slugify(slug.value), { emitEvent: false });
    slug.markAsDirty();
    slug.updateValueAndValidity();
  }

  submit(): void {
    if (this.currentStep() !== TOTAL_STEPS) { this.next(); return; }
    if (!this.validateAll()) return;

    this.facade.register(this.toRegistrationRequest()).subscribe((result) => {
      void this.router.navigate(['/tenant-management/registration-pending', result.registrationId], { queryParams: { statusToken: result.statusToken } });
    });
  }

  private validateAll(): boolean {
    let valid = true;
    for (const step of this.steps) valid = this.validateStep(step.id) && valid;
    return valid;
  }

  private validateStep(step: OnboardingStep): boolean {
    this.temperatureRangeError.set(false);
    this.taxIdError.set(false);
    const controls = this.controlsForStep(step);
    controls.forEach((control) => control.markAsTouched());

    if (step === 1) {
      const taxId = this.form.controls.businessIdentifier.value.trim();
      this.taxIdError.set(this.form.controls.country.value === 'peru' ? !/^(10|15|17|20)\d{9}$/.test(taxId) : taxId.length < 6);
    }
    if (step === 2) {
      const min = this.form.controls.minTemperature.value;
      const max = this.form.controls.maxTemperature.value;
      this.temperatureRangeError.set(min === null || max === null || min >= max);
    }
    return controls.every((control) => control.valid) && !this.taxIdError() && !this.temperatureRangeError();
  }

  private controlsForStep(step: OnboardingStep): readonly AbstractControl[] {
    switch (step) {
      case 1: return [this.form.controls.legalName, this.form.controls.displayName, this.form.controls.businessIdentifier, this.form.controls.industrySector, this.form.controls.companyMemberCount, this.form.controls.country, this.form.controls.website];
      case 2: return [this.form.controls.operationType, this.form.controls.monthlyVolume, this.form.controls.deliveryCoverage, this.form.controls.minTemperature, this.form.controls.maxTemperature, this.form.controls.categories];
      case 3: return [this.form.controls.storageSiteName, this.form.controls.storageSiteAddress, this.form.controls.city, this.form.controls.district, this.form.controls.locationCountry, this.form.controls.warehouseCount, this.form.controls.coldRoomsCount, this.form.controls.capacityEstimate];
      case 4: return [this.form.controls.firstName, this.form.controls.lastName, this.form.controls.jobTitle, this.form.controls.founderEmail, this.form.controls.phonePrefix, this.form.controls.phone, this.form.controls.preferredLanguage];
      case 5: return [this.form.controls.workspaceName, this.form.controls.workspaceSlug, this.form.controls.workspaceDisplayName, this.form.controls.referencePlan];
      case 6: return [this.form.controls.termsAccepted];
    }
  }

  private toRegistrationRequest(): Record<string, unknown> {
    const raw = this.form.getRawValue();
    const founderDisplayName = `${raw.firstName.trim()} ${raw.lastName.trim()}`.trim();
    const storageSiteAddress = [raw.storageSiteAddress, raw.district, raw.city, raw.locationCountry, raw.locationReference]
      .map((value) => value.trim()).filter(Boolean).join(', ').slice(0, 240);
    return {
      legalName: raw.legalName.trim(),
      displayName: raw.displayName.trim(),
      businessIdentifier: raw.businessIdentifier.trim() || null,
      operationCategory: raw.operationType,
      storageSiteName: raw.storageSiteName.trim(),
      storageSiteAddress,
      founderEmail: raw.founderEmail.trim().toLowerCase(),
      founderDisplayName,
      workspaceName: raw.workspaceName.trim(),
      workspaceSlug: raw.workspaceSlug.trim().toLowerCase(),
      referencePlan: raw.referencePlan,
      termsVersion: raw.termsVersion,
      termsAccepted: raw.termsAccepted,
    };
  }

  private slugify(value: string): string {
    return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  }
}

function fileFromInput(input: HTMLInputElement): File | null {
  return input.files?.item(0) ?? null;
}
