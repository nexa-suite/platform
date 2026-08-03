import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationService } from '../../../iam/application/authentication.service';
import { ChangeFeedService } from '../../../core/change-feed/infrastructure/change-feed.service';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { ClientAccountsFacade } from '../application/client-accounts.facade';
import { ClientAccountCreateCommand, ClientAccountUpdateCommand } from '../domain/client-account.models';
import { printCurrentView } from '../../../shared/application/utilities/export.util';

@Component({ selector: 'nexa-client-account-detail-page', imports: [MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, RouterLink, TranslatePipe, ErrorStateComponent, LoadingStateComponent, PageHeaderComponent], templateUrl: './client-account-detail-page.component.html', styleUrl: './client-account-detail-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class ClientAccountDetailPageComponent {
  readonly facade = inject(ClientAccountsFacade);
  private readonly authentication = inject(AuthenticationService);
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
  readonly locationStatus = signal<'idle' | 'requesting' | 'ready' | 'denied' | 'unsupported'>('idle');
  readonly currentLocation = signal<{ readonly latitude: number; readonly longitude: number } | null>(null);
  readonly mapUrl = computed(() => this.mapsUrl(this.facade.state().item?.deliveryProfile ?? this.form.controls.deliveryProfile.value));
  readonly currentLocationMapUrl = computed(() => {
    const location = this.currentLocation();
    return location ? `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}` : null;
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
    if (this.id) this.facade.loadDetail(this.id);
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
  requestCurrentLocation(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { this.locationStatus.set('unsupported'); return; }
    this.locationStatus.set('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => { this.currentLocation.set({ latitude: position.coords.latitude, longitude: position.coords.longitude }); this.locationStatus.set('ready'); },
      () => this.locationStatus.set('denied'),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 }
    );
  }
  retry(): void { this.facade.retry(); }
  print(): void { printCurrentView(); }

  private mapsUrl(address: string | null | undefined): string | null {
    const normalized = address?.trim();
    return normalized ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalized)}` : null;
  }
}
