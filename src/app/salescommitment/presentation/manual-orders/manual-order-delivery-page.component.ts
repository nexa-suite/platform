import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable, map, of, switchMap } from 'rxjs';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { ManualOrderWizardFacade } from '../../application/manual-orders/manual-order-wizard.facade';
import { SalesCommitmentAddressReference, SalesCommitmentReferenceOption } from '../../domain/customer-reference.models';
import { ManualOrderClientCommand } from '../../domain/manual-orders/manual-order.models';
import { ManualOrderRoutePreviewComponent } from './manual-order-route-preview.component';

type DeliveryPriority = 'LOW' | 'MEDIUM' | 'HIGH';

@Component({
  selector: 'nexa-manual-order-delivery-page',
  standalone: true,
  imports: [ManualOrderRoutePreviewComponent, NexaIconComponent, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './manual-order-delivery-page.component.html',
  styleUrl: './manual-order-delivery-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualOrderDeliveryPageComponent {
  readonly facade = inject(ManualOrderWizardFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);

  readonly draftId = this.route.snapshot.paramMap.get('draftId') ?? '';
  readonly saving = signal(false);
  readonly selectedPriority = signal<DeliveryPriority>('MEDIUM');
  readonly departments = signal<readonly SalesCommitmentReferenceOption[]>([]);
  readonly provinces = signal<readonly SalesCommitmentReferenceOption[]>([]);
  readonly districts = signal<readonly SalesCommitmentReferenceOption[]>([]);
  readonly roadTypes = signal<readonly SalesCommitmentReferenceOption[]>([]);
  readonly draft = computed(() => this.facade.state().draft);
  private readonly trustedMapUrlCache: { readonly source: string; readonly value: SafeResourceUrl } | null = null;
  private loadedClientId: string | null = null;
  private hydratedDraftId: string | null = null;
  private hydratedAddressDraftId: string | null = null;
  private locationsLoaded = false;

  readonly form = this.fb.nonNullable.group({
    requestedDeliveryDate: [tomorrow(), Validators.required],
    priority: ['NORMAL', Validators.required],
    addressId: [''],
    departmentCode: ['', Validators.required],
    provinceCode: ['', Validators.required],
    districtCode: ['', Validators.required],
    reference: [''],
    roadType: ['AV', Validators.required],
    addressLine: ['', Validators.required],
    deliveryNotes: ['']
  });

  constructor() {
    this.loadLocations();
    if (this.draftId) this.facade.loadDraft(this.draftId);

    effect(() => {
      const state = this.facade.state();
      const draft = state.draft;
      if (draft?.id !== this.draftId) return;

      if (this.hydratedDraftId !== draft.id) {
        this.form.patchValue({
          requestedDeliveryDate: draft.requestedDeliveryDate ?? tomorrow(),
          priority: draft.priority || 'NORMAL',
          deliveryNotes: draft.delivery?.deliveryNotes ?? ''
        }, { emitEvent: false });
        this.selectedPriority.set(draft.priority === 'HIGH' ? 'HIGH' : 'MEDIUM');
        this.hydratedDraftId = draft.id;
      }

      const clientId = draft.client?.id ?? null;
      if (clientId && clientId !== this.loadedClientId) {
        this.loadedClientId = clientId;
        this.facade.loadAddresses(clientId);
      }

      if (this.hydratedAddressDraftId !== draft.id && state.addresses.length) {
        const requestedAddressId = draft.delivery?.addressId;
        const address = state.addresses.find((item) => item.active && item.id === requestedAddressId)
          ?? state.addresses.find((item) => item.active && item.defaultAddress)
          ?? state.addresses.find((item) => item.active);
        if (address) this.hydrateAddress(address);
        this.hydratedAddressDraftId = draft.id;
      }
    });
  }

  clientPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/client`; }
  itemsPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/items`; }
  reviewPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/review`; }

  clientName(): string {
    const client = this.draft()?.client;
    return client?.commercialName || client?.businessName || 'B2B client';
  }

  selectPriority(priority: DeliveryPriority): void {
    this.selectedPriority.set(priority);
    this.form.controls.priority.setValue(this.apiPriority(priority));
  }

  departmentChanged(): void {
    this.markAddressAsManual();
    this.form.patchValue({ provinceCode: '', districtCode: '' });
    this.provinces.set([]);
    this.districts.set([]);
    const code = this.form.controls.departmentCode.value;
    if (code) this.loadProvinces(code);
  }

  provinceChanged(): void {
    this.markAddressAsManual();
    this.form.patchValue({ districtCode: '' });
    this.districts.set([]);
    const code = this.form.controls.provinceCode.value;
    if (code) this.loadDistricts(code);
  }

  markAddressAsManual(): void { this.form.controls.addressId.setValue(''); }

  minDeliveryDate(): string { return today(); }

  dateWarning(): string {
    const value = this.form.controls.requestedDeliveryDate.value;
    if (!value) return 'manualOrder.dateRequired';
    return value < this.minDeliveryDate() ? 'manualOrder.dateWarning' : '';
  }

  canContinue(): boolean {
    const value = this.form.getRawValue();
    const addressReady = Boolean(value.addressId) || Boolean(value.departmentCode && value.provinceCode && value.districtCode && value.roadType && value.addressLine.trim());
    return Boolean(this.draft()?.client?.id) && !this.saving() && !this.dateWarning() && this.form.controls.requestedDeliveryDate.valid && addressReady;
  }

  destinationLabel(): string {
    const value = this.form.getRawValue();
    const district = this.referenceLabel(this.districts(), value.districtCode);
    const address = [this.roadTypeLabel(value.roadType), value.addressLine.trim(), district].filter(Boolean).join(' ');
    return address || 'Delivery address pending';
  }

  warehouseLabel(): string {
    const snapshot = this.draft()?.delivery?.warehouseSnapshot;
    return snapshot ? this.snapshotLabel(snapshot, ['name', 'address']) || 'Warehouse selected by server' : 'Warehouse selected by server';
  }

  mapEmbedUrl(): string | null {
    const destination = this.destinationLabel();
    return destination === 'Delivery address pending'
      ? null
      : `https://maps.google.com/maps?q=${encodeURIComponent(`${destination}, Peru`)}&hl=en&z=13&output=embed`;
  }

  openMapUrl(): string | null {
    const destination = this.destinationLabel();
    return destination === 'Delivery address pending'
      ? null
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${destination}, Peru`)}`;
  }

  trustedMapUrl(source: string): SafeResourceUrl {
    const cached = this.trustedMapUrlCache;
    if (cached?.source === source) return cached.value;
    return this.sanitizer.bypassSecurityTrustResourceUrl(source);
  }

  roadTypeLabel(code: string): string {
    const option = this.roadTypes().find((item) => item.code === code);
    if (option) return option.label;
    return ({ AV: 'Av.', CA: 'Calle', JR: 'Jr.' } as Readonly<Record<string, string>>)[code] ?? code;
  }

  save(): void {
    const draft = this.draft();
    const value = this.form.getRawValue();
    if (!draft?.client?.id || !this.draftId || !this.canContinue()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const priority = this.apiPriority(this.selectedPriority());
    const clientChanged = draft.requestedDeliveryDate !== value.requestedDeliveryDate || draft.priority !== priority;
    const updateClient$: Observable<unknown> = clientChanged
      ? this.facade.saveClient(this.draftId, this.clientCommand(draft, value.requestedDeliveryDate, priority))
      : of(draft);
    const address$ = value.addressId
      ? of(value.addressId)
      : this.facade.createAddress(draft.client.id, this.addressCommand(draft)).pipe(map((address) => address.id));

    updateClient$.pipe(
      switchMap(() => address$),
      switchMap((addressId) => this.facade.saveDelivery(this.draftId, {
        addressId,
        routeProvider: draft.delivery?.routeProvider ?? 'LOCAL_ESTIMATE',
        deliveryNotes: value.deliveryNotes.trim() || null
      }))
    ).subscribe({
      next: () => void this.router.navigate([this.reviewPath()]),
      error: () => this.saving.set(false)
    });
  }

  private loadLocations(): void {
    if (this.locationsLoaded) return;
    this.locationsLoaded = true;
    this.facade.reference('departments').subscribe({ next: (items) => this.departments.set(items) });
    this.facade.reference('road-types').subscribe({ next: (items) => this.roadTypes.set(items) });
  }

  private loadProvinces(departmentCode: string): void {
    this.facade.reference('provinces', departmentCode).subscribe({ next: (items) => this.provinces.set(items) });
  }

  private loadDistricts(provinceCode: string): void {
    this.facade.reference('districts', provinceCode).subscribe({ next: (items) => this.districts.set(items) });
  }

  private hydrateAddress(address: SalesCommitmentAddressReference): void {
    const addressLine = [address.streetName, address.streetNumber, address.interior].filter((item): item is string => Boolean(item?.trim())).join(' ') || address.line;
    this.form.patchValue({
      addressId: address.id,
      departmentCode: address.departmentCode,
      provinceCode: address.provinceCode,
      districtCode: address.districtCode,
      reference: address.reference,
      roadType: address.roadType || address.addressType || 'AV',
      addressLine,
      deliveryNotes: this.draft()?.delivery?.deliveryNotes ?? ''
    }, { emitEvent: false });
    if (address.departmentCode) this.loadProvinces(address.departmentCode);
    if (address.provinceCode) this.loadDistricts(address.provinceCode);
  }

  private clientCommand(draft: NonNullable<ReturnType<ManualOrderDeliveryPageComponent['draft']>>, date: string, priority: string): ManualOrderClientCommand {
    return {
      clientAccountId: draft.client?.id ?? '',
      requestedDeliveryDate: date,
      priority,
      paymentPreference: draft.paymentPreference ?? 'CREDIT_LINE',
      currency: draft.currency || 'PEN',
      notes: draft.notes
    };
  }

  private addressCommand(draft: NonNullable<ReturnType<ManualOrderDeliveryPageComponent['draft']>>) {
    const value = this.form.getRawValue();
    const address = splitStreetAddress(value.addressLine);
    return {
      label: [this.roadTypeLabel(value.roadType), value.addressLine.trim()].filter(Boolean).join(' '),
      address: {
        addressType: 'STREET',
        line: [this.roadTypeLabel(value.roadType), value.addressLine.trim()].filter(Boolean).join(' '),
        reference: value.reference.trim(),
        countryCode: 'PE' as const,
        departmentCode: value.departmentCode,
        provinceCode: value.provinceCode,
        districtCode: value.districtCode,
        recipientName: draft.client?.commercialName ?? null,
        recipientPhone: null,
        roadType: value.roadType || null,
        streetName: address.streetName,
        streetNumber: address.streetNumber,
        interior: null,
        postalCode: null,
        receivingInstructions: value.deliveryNotes.trim() || null,
        receivingHours: null,
        latitude: null,
        longitude: null,
        placeId: null,
        source: 'MANUAL'
      },
      defaultAddress: false
    };
  }

  private apiPriority(priority: DeliveryPriority): string { return priority === 'HIGH' ? 'HIGH' : 'NORMAL'; }

  private referenceLabel(items: readonly SalesCommitmentReferenceOption[], code: string): string {
    return items.find((item) => item.code === code)?.label ?? code;
  }

  private snapshotLabel(snapshot: string, keys: readonly string[]): string {
    try {
      const value = JSON.parse(snapshot) as Record<string, unknown>;
      return keys.map((key) => value[key]).filter((item): item is string => typeof item === 'string' && item.trim().length > 0).join(', ');
    } catch {
      return '';
    }
  }
}

function splitStreetAddress(value: string): { readonly streetName: string | null; readonly streetNumber: string | null } {
  const normalized = value.trim();
  const match = normalized.match(/^(.+?)\s+(\d+[A-Za-z0-9/-]*)$/);
  return { streetName: match?.[1]?.trim() || normalized || null, streetNumber: match?.[2]?.trim() || null };
}

function today(): string {
  const value = new Date();
  return value.toISOString().slice(0, 10);
}

function tomorrow(): string {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  return value.toISOString().slice(0, 10);
}
