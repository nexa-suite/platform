import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PlatformAuthenticationBoundary } from '../../core/security/platform-authentication.boundary';
import { ChangeFeedService } from '../../core/change-feed/application/change-feed.service';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { ClientAccountsFacade } from '../application/client-accounts.facade';
import { BuyerMembershipCandidate, ClientAccountAddress, ClientAccountCreateCommand, ClientAccountUpdateCommand, PeruReferenceOption } from '../domain/client-account.models';
import { ClientAccountAddressCommand, ClientAccountAddressUpdateCommand, DeliveryAddressCommand } from '../domain/client-account.models';
import { printCurrentView } from '../../shared/application/utilities/export.util';

@Component({ selector: 'nexa-client-account-detail-page', imports: [DecimalPipe, MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule, RouterLink, TranslatePipe, ErrorStateComponent, LoadingStateComponent, PageHeaderComponent], templateUrl: './client-account-detail-page.component.html', styleUrl: './client-account-detail-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class ClientAccountDetailPageComponent {
  readonly facade = inject(ClientAccountsFacade);
  private readonly authentication = inject(PlatformAuthenticationBoundary);
  readonly canWrite = computed(() => this.authentication.hasPermission('sales:write'));
  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{2,32}$/)] }),
    businessName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    commercialName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    countryCode: new FormControl('PE', { nonNullable: true, validators: [Validators.required, Validators.maxLength(2)] }),
    taxType: new FormControl('RUC', { nonNullable: true, validators: [Validators.required] }),
    taxValue: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{11}$/)] }),
    segment: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    contactPerson: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    contactEmail: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    deliveryProfile: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    paymentCondition: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    buyerMembershipId: new FormControl('', { nonNullable: true })
  });
  private readonly feed = inject(ChangeFeedService);
  private readonly id: string | null;
  readonly isCreate: boolean;
  readonly locationStatus = signal<'idle' | 'requesting' | 'ready' | 'denied' | 'timeout' | 'unavailable' | 'unsupported'>('idle');
  readonly currentLocation = signal<{ readonly latitude: number; readonly longitude: number; readonly accuracy: number } | null>(null);
  readonly mapUrl = computed(() => this.mapsUrl(this.facade.state().item?.deliveryProfile ?? this.form.controls.deliveryProfile.value));
  readonly currentLocationMapUrl = computed(() => {
    const location = this.currentLocation();
    return location ? `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}` : null;
  });
  readonly addresses = signal<readonly ClientAccountAddress[]>([]);
  readonly buyerMembershipCandidates = signal<readonly BuyerMembershipCandidate[]>([]);
  readonly addressError = signal<string | null>(null);
  readonly addressFormOpen = signal(false);
  readonly editingAddressId = signal<string | null>(null);
  readonly departments = signal<readonly PeruReferenceOption[]>([]);
  readonly provinces = signal<readonly PeruReferenceOption[]>([]);
  readonly districts = signal<readonly PeruReferenceOption[]>([]);
  readonly roadTypes = signal<readonly PeruReferenceOption[]>([]);
  readonly addressForm = new FormGroup({
    label: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    addressType: new FormControl('STREET', { nonNullable: true, validators: [Validators.required] }),
    line: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(240)] }),
    reference: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
    recipientName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(160)] }),
    recipientPhone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(48)] }),
    streetName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(180)] }),
    streetNumber: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(32)] }),
    interior: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(64)] }),
    postalCode: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(32)] }),
    receivingInstructions: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
    receivingHours: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(240)] }),
    latitude: new FormControl<number | null>(null),
    longitude: new FormControl<number | null>(null),
    placeId: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(240)] }),
    source: new FormControl('MANUAL', { nonNullable: true }),
    departmentCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    provinceCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    districtCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    defaultAddress: new FormControl(false, { nonNullable: true }),
  });

  private seededAccountId: string | null = null;

  constructor() {
    this.id = inject(ActivatedRoute).snapshot.paramMap.get('clientAccountId');
    this.isCreate = this.id === null;
    this.feed.connect();
    effect(() => {
      const account = this.facade.state().item;
      if (!account || account.id === this.seededAccountId) return;
      this.seededAccountId = account.id;
      this.form.reset({ ...account, buyerMembershipId: account.buyerMembershipId ?? '' });
    });
    if (this.id) {
      this.facade.loadDetail(this.id);
      this.loadAddresses(this.id);
      this.facade.buyerMembershipCandidates().subscribe({ next: (items) => this.buyerMembershipCandidates.set(items) });
      this.facade.reference('departments').subscribe({ next: (items) => this.departments.set(items) });
      this.facade.reference('road-types').subscribe({ next: (items) => this.roadTypes.set(items) });
    }
  }

  save(): void {
    if (!this.canWrite()) return;
    const account = this.facade.state().item;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    if (account) {
      const command: ClientAccountUpdateCommand = {
        businessName: value.businessName,
        commercialName: value.commercialName,
        segment: value.segment,
        contactPerson: value.contactPerson,
        contactEmail: value.contactEmail,
        phone: value.phone,
        deliveryProfile: value.deliveryProfile,
        paymentCondition: value.paymentCondition
      };
      this.facade.update(account.id, account.version, command);
    } else {
      const command: ClientAccountCreateCommand = {
        code: value.code,
        businessName: value.businessName,
        commercialName: value.commercialName,
        countryCode: value.countryCode,
        taxType: value.taxType,
        taxValue: value.taxValue,
        segment: value.segment,
        contactPerson: value.contactPerson,
        contactEmail: value.contactEmail,
        phone: value.phone,
        deliveryProfile: value.deliveryProfile,
        paymentCondition: value.paymentCondition
      };
      this.facade.create(command);
    }
  }
  activate(): void { const account = this.facade.state().item; if (this.canWrite() && account) this.facade.changeStatus(account.id, account.version, 'activations'); }
  suspend(): void { const account = this.facade.state().item; if (this.canWrite() && account) this.facade.changeStatus(account.id, account.version, 'suspensions'); }
  associateBuyer(): void { const account = this.facade.state().item; if (this.canWrite() && account) this.facade.associateBuyer(account.id, account.version, this.form.controls.buyerMembershipId.value.trim() || null); }
  buyerMembershipLabel(): string {
    const id = this.facade.state().item?.buyerMembershipId;
    if (!id) return '—';
    const candidate = this.buyerMembershipCandidates().find((item) => item.id === id);
    return candidate ? `${candidate.displayName} · ${candidate.email}` : 'Buyer membership asociada';
  }
  requestCurrentLocation(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { this.locationStatus.set('unsupported'); return; }
    this.locationStatus.set('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => { const location = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }; this.currentLocation.set(location); if (this.addressFormOpen()) this.addressForm.patchValue({ latitude: location.latitude, longitude: location.longitude, source: 'CURRENT_LOCATION' }); this.locationStatus.set('ready'); },
      (error) => this.locationStatus.set(error.code === 1 ? 'denied' : error.code === 3 ? 'timeout' : 'unavailable'),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 }
    );
  }
  openAddressForm(): void { this.editingAddressId.set(null); this.addressForm.reset({ label: '', addressType: 'STREET', line: '', reference: '', recipientName: '', recipientPhone: '', streetName: '', streetNumber: '', interior: '', postalCode: '', receivingInstructions: '', receivingHours: '', latitude: null, longitude: null, placeId: '', source: 'MANUAL', departmentCode: '', provinceCode: '', districtCode: '', defaultAddress: false }); this.provinces.set([]); this.districts.set([]); this.addressError.set(null); this.addressFormOpen.set(true); }
  editAddress(address: ClientAccountAddress): void {
    this.editingAddressId.set(address.id);
    this.addressForm.patchValue({ label: address.label, addressType: address.addressType, line: address.line, reference: address.reference, recipientName: address.recipientName ?? '', recipientPhone: address.recipientPhone ?? '', streetName: address.streetName ?? '', streetNumber: address.streetNumber ?? '', interior: address.interior ?? '', postalCode: address.postalCode ?? '', receivingInstructions: address.receivingInstructions ?? '', receivingHours: address.receivingHours ?? '', latitude: address.latitude ?? null, longitude: address.longitude ?? null, placeId: address.placeId ?? '', source: address.source ?? 'MANUAL', departmentCode: address.departmentCode, provinceCode: address.provinceCode, districtCode: address.districtCode, defaultAddress: address.defaultAddress });
    this.addressFormOpen.set(true);
    this.facade.reference('provinces', address.departmentCode).subscribe({ next: (items) => this.provinces.set(items) });
    this.facade.reference('districts', address.provinceCode).subscribe({ next: (items) => this.districts.set(items) });
  }
  cancelAddress(): void { this.addressFormOpen.set(false); this.editingAddressId.set(null); this.addressError.set(null); }
  departmentChanged(): void { this.addressForm.patchValue({ provinceCode: '', districtCode: '' }); this.districts.set([]); const code = this.addressForm.controls.departmentCode.value; if (code) this.facade.reference('provinces', code).subscribe({ next: (items) => this.provinces.set(items) }); }
  provinceChanged(): void { this.addressForm.patchValue({ districtCode: '' }); const code = this.addressForm.controls.provinceCode.value; if (code) this.facade.reference('districts', code).subscribe({ next: (items) => this.districts.set(items) }); }
  saveAddress(): void {
    const account = this.facade.state().item;
    if (!account || !this.canWrite()) return;
    if (this.addressForm.invalid) { this.addressForm.markAllAsTouched(); return; }
    const value = this.addressForm.getRawValue();
    const address: DeliveryAddressCommand = { addressType: value.addressType, line: value.line, reference: value.reference, countryCode: 'PE', departmentCode: value.departmentCode, provinceCode: value.provinceCode, districtCode: value.districtCode, recipientName: value.recipientName || null, recipientPhone: value.recipientPhone || null, roadType: value.addressType, streetName: value.streetName || null, streetNumber: value.streetNumber || null, interior: value.interior || null, postalCode: value.postalCode || null, receivingInstructions: value.receivingInstructions || null, receivingHours: value.receivingHours || null, latitude: value.latitude, longitude: value.longitude, placeId: value.placeId || null, source: value.source };
    const id = this.editingAddressId();
    const operation = id
      ? this.facade.updateClientAccountAddress(account.id, id, this.addresses().find((item) => item.id === id)?.version ?? 0, { label: value.label, address } as ClientAccountAddressUpdateCommand)
      : this.facade.createClientAccountAddress(account.id, { label: value.label, address, defaultAddress: value.defaultAddress } as ClientAccountAddressCommand);
    operation.subscribe({ next: (item) => { this.addresses.update((items) => id ? items.map((current) => current.id === item.id ? item : current) : [...items, item]); this.cancelAddress(); }, error: () => this.addressError.set('CLIENT_ACCOUNT_ADDRESS_SAVE_FAILED') });
  }
  makeDefaultAddress(address: ClientAccountAddress): void { const account = this.facade.state().item; if (!account || address.defaultAddress || !this.canWrite()) return; this.facade.setDefaultClientAccountAddress(account.id, address.id, address.version).subscribe({ next: (item) => this.addresses.update((items) => items.map((current) => ({ ...current, defaultAddress: current.id === item.id, version: current.id === item.id ? item.version : current.version }))), error: () => this.addressError.set('CLIENT_ACCOUNT_ADDRESS_CONCURRENCY_FAILED') }); }
  deactivateAddress(address: ClientAccountAddress): void { const account = this.facade.state().item; if (!account || !address.active || !this.canWrite()) return; this.facade.deactivateClientAccountAddress(account.id, address.id, address.version).subscribe({ next: (item) => this.addresses.update((items) => items.map((current) => current.id === item.id ? item : current)), error: () => this.addressError.set('CLIENT_ACCOUNT_ADDRESS_CONCURRENCY_FAILED') }); }
  addressDisplay(address: ClientAccountAddress): string { return [address.addressType, address.line, address.reference, this.labelFor(address.districtCode), this.labelFor(address.provinceCode), this.labelFor(address.departmentCode)].filter(Boolean).join(', '); }
  addressMap(address: ClientAccountAddress): string { return address.latitude != null && address.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.addressDisplay(address) + ', Peru')}`; }
  retry(): void { this.facade.retry(); }
  print(): void { printCurrentView(); }

  private mapsUrl(address: string | null | undefined): string | null {
    const normalized = address?.trim();
    return normalized ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalized)}` : null;
  }
  private loadAddresses(id: string): void { this.facade.clientAccountAddresses(id).subscribe({ next: (items) => this.addresses.set(items), error: () => this.addressError.set('CLIENT_ACCOUNT_ADDRESSES_LOAD_FAILED') }); }
  private labelFor(code: string): string { return [...this.departments(), ...this.provinces(), ...this.districts()].find((item) => item.code === code)?.label ?? code; }
}
