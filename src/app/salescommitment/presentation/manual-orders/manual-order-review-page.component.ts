import { LowerCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable, of, switchMap } from 'rxjs';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { ManualOrderWizardFacade } from '../../application/manual-orders/manual-order-wizard.facade';
import { ManualOrderClientCommand, ManualOrderLine, ManualOrderLineCommand, ManualOrderReview } from '../../domain/manual-orders/manual-order.models';
import { SalesCommitmentCatalogItem } from '../../domain/sales-commitment-catalog.models';

@Component({
  selector: 'nexa-manual-order-review-page',
  standalone: true,
  imports: [LowerCasePipe, NexaIconComponent, RouterLink, TranslatePipe],
  templateUrl: './manual-order-review-page.component.html',
  styleUrl: './manual-order-review-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualOrderReviewPageComponent {
  readonly facade = inject(ManualOrderWizardFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly draftId = this.route.snapshot.paramMap.get('draftId') ?? '';
  readonly submitting = signal(false);
  readonly review = computed<ManualOrderReview | null>(() => this.facade.state().review);
  readonly editedQuantities = signal<Readonly<Record<string, number>>>({});
  readonly reviewPriority = signal<'NORMAL' | 'HIGH'>('NORMAL');
  readonly dispatchNote = signal('');
  private hydratedReviewId: string | null = null;
  private loadedClientId: string | null = null;

  constructor() {
    this.facade.loadReferences();
    if (this.draftId) this.facade.loadReview(this.draftId);
    effect(() => {
      const review = this.facade.state().review;
      if (!review || review.draft.id !== this.draftId || this.hydratedReviewId === review.draft.id) return;
      this.reviewPriority.set(review.draft.priority === 'HIGH' ? 'HIGH' : 'NORMAL');
      this.dispatchNote.set(review.draft.notes ?? '');
      this.editedQuantities.set({});
      this.hydratedReviewId = review.draft.id;
    });
    effect(() => {
      const clientId = this.facade.state().review?.draft.client?.id ?? null;
      if (clientId && clientId !== this.loadedClientId) {
        this.loadedClientId = clientId;
        this.facade.loadAddresses(clientId);
      }
    });
  }

  clientPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/client`; }
  itemsPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/items`; }
  deliveryPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/delivery`; }

  clientName(): string {
    const client = this.review()?.draft.client;
    return client?.commercialName || client?.businessName || 'B2B client';
  }

  catalogItem(line: ManualOrderLine): SalesCommitmentCatalogItem | null {
    const id = line.catalogItemId ?? line.skuId;
    return this.facade.state().catalogItems.find((item) => item.id === id) ?? null;
  }

  lineName(line: ManualOrderLine): string { return this.catalogItem(line)?.name || line.productFamily || line.skuCode || 'Catalog item'; }
  lineImage(line: ManualOrderLine): string | null { return this.catalogItem(line)?.image.url ?? null; }
  lineQuantity(line: ManualOrderLine): number { return this.editedQuantities()[line.id] ?? line.quantity; }
  lineTotal(line: ManualOrderLine): number { return line.effectiveUnitPrice * this.lineQuantity(line); }
  total(): number { return this.review()?.draft.lines.reduce((sum, line) => sum + this.lineTotal(line), 0) ?? 0; }
  totalUnits(): number { return this.review()?.draft.lines.reduce((sum, line) => sum + this.lineQuantity(line), 0) ?? 0; }

  money(amount: number, currency = this.review()?.draft.currency ?? 'PEN'): string { return `${currency === 'PEN' ? 'S/' : currency} ${amount.toFixed(2)}`; }
  unitLabel(unit: string): string { return unit.trim().toUpperCase() === 'UNIT' ? 'UN' : unit; }
  availabilityLabel(line: ManualOrderLine): string { return line.availabilityStatus.replaceAll('_', ' ').toLowerCase(); }

  changeQuantity(line: ManualOrderLine, delta: number): void { this.setQuantity(line, this.lineQuantity(line) + delta); }

  setQuantity(line: ManualOrderLine, value: string | number): void {
    const quantity = Number(value);
    if (!Number.isFinite(quantity)) return;
    this.editedQuantities.update((current) => ({ ...current, [line.id]: Math.max(1, Math.round(quantity)) }));
  }

  priorityLabel(): string { return this.reviewPriority() === 'HIGH' ? 'manualOrder.priority.high' : 'manualOrder.priority.medium'; }

  deliveryDestination(): string {
    const draft = this.review()?.draft;
    const addressId = draft?.delivery?.addressId;
    const reference = addressId ? this.facade.state().addresses.find((address) => address.id === addressId) : null;
    if (reference?.line) return reference.line;
    if (draft?.delivery?.addressSnapshot) {
      const snapshot = this.snapshot(draft.delivery.addressSnapshot);
      const value = [snapshot?.['roadType'], snapshot?.['street'], snapshot?.['number'], snapshot?.['district']].filter((item): item is string => typeof item === 'string' && item.trim().length > 0).join(' ');
      if (value) return value;
    }
    return 'Delivery route pending';
  }

  priorityChanged(value: string): void { this.reviewPriority.set(value === 'HIGH' ? 'HIGH' : 'NORMAL'); }
  noteChanged(value: string): void { this.dispatchNote.set(value); }
  canConfirm(): boolean { return Boolean(this.review()?.readyToCreate) && !this.submitting(); }

  confirm(): void {
    const data = this.review();
    if (!data?.readyToCreate || !this.draftId) return;

    this.submitting.set(true);
    const linesChanged = data.draft.lines.some((line) => this.lineQuantity(line) !== line.quantity);
    const saveLines$: Observable<unknown> = linesChanged
      ? this.facade.saveItems(this.draftId, this.lineCommands(data.draft.lines))
      : of(data.draft);

    saveLines$.pipe(
      switchMap(() => this.reviewClientChanged(data.draft)
        ? this.facade.saveClient(this.draftId, this.clientCommand(data.draft))
        : of(data.draft)),
      switchMap(() => this.facade.submit(this.draftId))
    ).subscribe({
      next: (order) => void this.router.navigate(['/ops/commercial/sales-orders', order.id]),
      error: () => this.submitting.set(false)
    });
  }

  abandon(): void {
    if (!this.draftId) return;
    this.facade.abandon(this.draftId).subscribe({ next: () => void this.router.navigate(['/ops/commercial/purchase-orders']) });
  }

  private lineCommands(lines: readonly ManualOrderLine[]): readonly ManualOrderLineCommand[] {
    return lines.map((line) => ({ catalogItemId: line.catalogItemId, skuId: line.skuId, quantity: this.lineQuantity(line), unit: line.unit, notes: line.notes }));
  }

  private reviewClientChanged(draft: ManualOrderReview['draft']): boolean { return draft.priority !== this.reviewPriority() || (draft.notes ?? '') !== this.dispatchNote().trim(); }

  private clientCommand(draft: ManualOrderReview['draft']): ManualOrderClientCommand {
    return { clientAccountId: draft.client?.id ?? '', requestedDeliveryDate: draft.requestedDeliveryDate ?? '', priority: this.reviewPriority(), paymentPreference: draft.paymentPreference ?? 'CREDIT_LINE', currency: draft.currency || 'PEN', notes: this.dispatchNote().trim() || null };
  }

  private snapshot(value: string): Record<string, unknown> | null {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
    } catch { return null; }
  }
}
