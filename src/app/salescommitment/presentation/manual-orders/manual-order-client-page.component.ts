import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { SalesCommitmentAddressReference, SalesCommitmentCustomerReference } from '../../domain/customer-reference.models';
import { ManualOrderWizardFacade } from '../../application/manual-orders/manual-order-wizard.facade';

@Component({
  selector: 'nexa-manual-order-client-page',
  standalone: true,
  imports: [NexaIconComponent, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './manual-order-client-page.component.html',
  styleUrl: './manual-order-client-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualOrderClientPageComponent {
  readonly facade = inject(ManualOrderWizardFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly runtime = inject(PLATFORM_RUNTIME_CONFIG);

  readonly draftId = this.route.snapshot.paramMap.get('draftId') ?? '';
  readonly saving = signal(false);
  readonly query = signal('');
  readonly selectedClientId = signal('');
  readonly companyName = computed(() => this.runtime.tenantProfile === 'icisa' ? 'ICISA Distribuciones' : 'Nexa');
  readonly selectedClient = computed(() => this.facade.state().clients.find((client) => client.id === this.selectedClientId()) ?? null);
  readonly filteredClients = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    if (!query) return this.facade.state().clients;
    return this.facade.state().clients.filter((client) => [
      client.code,
      client.businessName,
      client.commercialName,
      client.taxValue,
      client.segment,
      client.contactPerson,
      client.contactEmail,
      client.phone,
    ].filter((value): value is string => Boolean(value)).some((value) => value.toLocaleLowerCase().includes(query)));
  });

  readonly form = this.fb.nonNullable.group({
    clientAccountId: ['', Validators.required],
    requestedDeliveryDate: [tomorrow(), Validators.required],
    priority: ['NORMAL', Validators.required],
    paymentPreference: ['CREDIT_LINE', Validators.required],
    currency: ['PEN', [Validators.required, Validators.maxLength(3)]],
    notes: ['']
  });

  private loadedClientId: string | null = null;
  private hydratedDraftId: string | null = null;

  constructor() {
    this.facade.loadReferences();
    if (this.draftId) this.facade.loadDraft(this.draftId);

    effect(() => {
      const draft = this.facade.state().draft;
      if (draft?.id === this.draftId && this.hydratedDraftId !== draft.id) {
        const clientId = draft.client?.id ?? '';
        this.selectedClientId.set(clientId);
        this.form.patchValue({
          clientAccountId: clientId,
          requestedDeliveryDate: draft.requestedDeliveryDate ?? tomorrow(),
          priority: draft.priority || 'NORMAL',
          paymentPreference: draft.paymentPreference ?? 'CREDIT_LINE',
          currency: draft.currency || 'PEN',
          notes: draft.notes ?? ''
        }, { emitEvent: false });
        this.hydratedDraftId = draft.id;
      }

      const clientId = draft?.client?.id ?? null;
      if (clientId && clientId !== this.loadedClientId) {
        this.loadedClientId = clientId;
        this.facade.loadAddresses(clientId);
      }
    });
  }

  purchaseOrdersPath(): string { return '/ops/commercial/purchase-orders'; }
  itemsPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/items`; }

  selectClient(client: SalesCommitmentCustomerReference): void {
    this.selectedClientId.set(client.id);
    this.form.controls.clientAccountId.setValue(client.id);
    this.form.controls.clientAccountId.markAsDirty();
    this.form.controls.paymentPreference.setValue(this.paymentPreference(client));
    if (client.id !== this.loadedClientId) {
      this.loadedClientId = client.id;
      this.facade.loadAddresses(client.id);
    }
  }

  setQuery(value: string): void { this.query.set(value); }

  setPaymentPreference(value: string): void {
    if (['CREDIT_LINE', 'BANK_TRANSFER', 'CASH', 'CASH_ON_DELIVERY'].includes(value)) {
      this.form.controls.paymentPreference.setValue(value);
    }
  }

  clientAddress(client: SalesCommitmentCustomerReference): SalesCommitmentAddressReference | null {
    if (client.id !== this.selectedClientId()) return null;
    const addresses = this.facade.state().addresses.filter((address) => address.active && address.clientAccountId === client.id);
    return addresses.find((address) => address.defaultAddress) ?? addresses[0] ?? null;
  }

  conditionTone(client: SalesCommitmentCustomerReference): 'success' | 'warning' {
    return client.status.trim().toUpperCase() === 'ACTIVE' ? 'success' : 'warning';
  }

  conditionIcon(client: SalesCommitmentCustomerReference): 'check' | 'warning' {
    return this.conditionTone(client) === 'success' ? 'check' : 'warning';
  }

  statusKey(client: SalesCommitmentCustomerReference): string {
    return client.status.trim().toUpperCase() === 'ACTIVE' ? 'manualOrder.active' : 'manualOrder.observed';
  }

  statusMessageKey(client: SalesCommitmentCustomerReference): string {
    return client.status.trim().toUpperCase() === 'ACTIVE' ? 'manualOrder.validatedMessage' : 'manualOrder.observedMessage';
  }

  clientType(client: SalesCommitmentCustomerReference): string {
    return client.segment?.trim() || 'manualOrder.clientTypeFallback';
  }

  paymentConditionKey(client: SalesCommitmentCustomerReference): string {
    return `manualOrder.paymentConditions.${client.paymentCondition?.trim().toUpperCase() || 'UNKNOWN'}`;
  }

  canContinue(): boolean {
    return this.selectedClient()?.status.trim().toUpperCase() === 'ACTIVE' && this.form.valid && !this.saving();
  }

  save(): void {
    const client = this.selectedClient();
    if (!client || !this.draftId || !this.canContinue()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.facade.saveClient(this.draftId, this.form.getRawValue()).subscribe({
      next: () => void this.router.navigate(['/ops/commercial/manual-orders', this.draftId, 'items']),
      error: () => this.saving.set(false)
    });
  }

  abandon(): void {
    if (!this.draftId) return;
    this.facade.abandon(this.draftId).subscribe({ next: () => void this.router.navigate([this.purchaseOrdersPath()]) });
  }

  private paymentPreference(client: SalesCommitmentCustomerReference): string {
    const condition = client.paymentCondition.trim().toUpperCase();
    if (condition.includes('CASH')) return 'CASH_ON_DELIVERY';
    if (condition.includes('PREPAID')) return 'CASH';
    return 'CREDIT_LINE';
  }
}

function tomorrow(): string {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  return value.toISOString().slice(0, 10);
}
