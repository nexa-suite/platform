import { Injectable, signal } from '@angular/core';
import { DeliveryAddressCommand, PurchaseRequestLineCommand } from '../../infrastructure/http/sales-operations-api.service';

export type ManualOrderWizardStep = 'client' | 'items' | 'delivery' | 'review';
export type ManualOrderPriority = 'NORMAL' | 'HIGH' | 'URGENT';

export interface ManualOrderWizardState {
  readonly draftId: string | null;
  readonly clientAccountId: string;
  readonly addressId: string | null;
  readonly manualAddress: DeliveryAddressCommand | null;
  readonly requestedDeliveryDate: string;
  readonly deliveryNotes: string;
  readonly warehouseId: string | null;
  readonly routeProvider: string | null;
  readonly paymentOption: string;
  readonly priority: ManualOrderPriority;
  readonly currency: string;
  readonly notes: string;
  readonly lines: readonly PurchaseRequestLineCommand[];
  readonly version: number;
}

const EMPTY_STATE: ManualOrderWizardState = {
  draftId: null,
  clientAccountId: '',
  addressId: null,
  manualAddress: null,
  requestedDeliveryDate: '',
  deliveryNotes: '',
  warehouseId: null,
  routeProvider: null,
  paymentOption: 'CREDIT_LINE',
  priority: 'NORMAL',
  currency: 'PEN',
  notes: '',
  lines: [],
  version: 0,
};

@Injectable({ providedIn: 'root' })
export class ManualOrderWizardStateService {
  readonly state = signal<ManualOrderWizardState>(EMPTY_STATE);

  start(draftId: string | null): void {
    if (this.state().draftId !== draftId) this.state.set({ ...EMPTY_STATE, draftId });
  }

  updateClient(value: Pick<ManualOrderWizardState, 'clientAccountId' | 'paymentOption' | 'priority' | 'currency' | 'notes' | 'requestedDeliveryDate'>): void {
    this.state.update((current) => ({ ...current, ...value }));
  }

  updateLines(lines: readonly PurchaseRequestLineCommand[]): void {
    this.state.update((current) => ({ ...current, lines: [...lines] }));
  }

  updateDelivery(value: Pick<ManualOrderWizardState, 'addressId' | 'manualAddress' | 'requestedDeliveryDate' | 'deliveryNotes' | 'warehouseId' | 'routeProvider'>): void {
    this.state.update((current) => ({ ...current, ...value }));
  }

  hydrate(value: { readonly id: string; readonly version: number; readonly clientAccountId: string; readonly requestedDeliveryDate: string; readonly priority: ManualOrderPriority; readonly paymentPreference: string; readonly currency: string; readonly notes: string; readonly lines: readonly PurchaseRequestLineCommand[]; readonly addressId: string | null; readonly deliveryNotes: string; readonly warehouseId: string | null; readonly routeProvider: string | null }): void {
    this.state.update((current) => ({ ...current, draftId: value.id, version: value.version, clientAccountId: value.clientAccountId, requestedDeliveryDate: value.requestedDeliveryDate, priority: value.priority, paymentOption: value.paymentPreference, currency: value.currency, notes: value.notes, lines: [...value.lines], addressId: value.addressId, deliveryNotes: value.deliveryNotes, warehouseId: value.warehouseId, routeProvider: value.routeProvider }));
  }

  path(step: ManualOrderWizardStep): string {
    const draftId = this.state().draftId;
    return draftId ? `/ops/commercial/manual-orders/${encodeURIComponent(draftId)}/${step}` : `/ops/commercial/manual-orders/new/${step}`;
  }
}
