import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PlatformCatalogCartFacade } from '../../../core/presentation/catalog-cart/platform-catalog-cart.facade';
import { ManualOrderWizardFacade } from '../../application/manual-orders/manual-order-wizard.facade';
import { ManualOrderDraft, ManualOrderLine, ManualOrderLineCommand } from '../../domain/manual-orders/manual-order.models';
import type { ManualOrderCartItem } from '../../domain/manual-orders/manual-order-cart.models';
import type { SalesCommitmentCatalogItem } from '../../domain/sales-commitment-catalog.models';

@Component({
  selector: 'nexa-manual-order-items-page',
  standalone: true,
  imports: [NexaIconComponent, RouterLink, TranslatePipe],
  templateUrl: './manual-order-items-page.component.html',
  styleUrl: './manual-order-items-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualOrderItemsPageComponent {
  readonly facade = inject(ManualOrderWizardFacade);
  readonly cart = inject(PlatformCatalogCartFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly draftId = this.route.snapshot.paramMap.get('draftId') ?? '';
  readonly saving = signal(false);
  readonly lines = computed<readonly ManualOrderLineCommand[]>(() => this.cart.items().map((item) => ({
    catalogItemId: item.catalogItemId,
    skuId: item.skuId,
    quantity: item.quantity,
    unit: item.unit,
    notes: item.notes || null,
  })));

  constructor() {
    this.cart.activate(this.draftId);
    this.facade.loadReferences();
    if (this.draftId) this.facade.loadDraft(this.draftId);

    effect(() => {
      const draft = this.facade.state().draft;
      const catalogItems = this.facade.state().catalogItems;
      if (draft?.id !== this.draftId || !draft.lines.length || this.cart.items().length || !catalogItems.length) return;

      this.replaceCartFromDraft(draft, catalogItems);
    });
  }

  clientPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/client`; }
  deliveryPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/delivery`; }
  catalogPath(): string { return '/ops/product-catalog'; }
  catalogQueryParams(): Record<string, string> { return { draftId: this.draftId }; }

  clientName(): string {
    const client = this.facade.state().draft?.client;
    return client?.commercialName || client?.businessName || 'B2B client';
  }

  lineItem(line: ManualOrderLineCommand): ManualOrderCartItem | null {
    return this.cart.items().find((item) => item.catalogItemId === line.catalogItemId) ?? null;
  }

  formatPrice(item: ManualOrderCartItem | null): string {
    if (!item || item.unitPriceAmount === null) return '—';
    return `${item.currency === 'PEN' ? 'S/' : item.currency} ${item.unitPriceAmount.toFixed(2)}`;
  }

  unitLabel(unit: string): string { return unit.trim().toUpperCase() === 'UNIT' ? 'UN' : unit; }

  lineTotal(line: ManualOrderLineCommand): number {
    const item = this.lineItem(line);
    return (item?.unitPriceAmount ?? 0) * line.quantity;
  }

  formatLineTotal(line: ManualOrderLineCommand, item: ManualOrderCartItem): string {
    const amount = this.lineTotal(line);
    return `${item.currency === 'PEN' ? 'S/' : item.currency} ${amount.toFixed(2)}`;
  }

  total(): string {
    const currency = this.cart.items()[0]?.currency === 'PEN' ? 'S/' : this.cart.items()[0]?.currency ?? 'PEN';
    return `${currency} ${this.cart.subtotal().toFixed(2)}`;
  }

  removeLine(line: ManualOrderLineCommand): void {
    if (line.catalogItemId) this.cart.remove(line.catalogItemId);
  }

  adjustQuantity(line: ManualOrderLineCommand, delta: number): void {
    if (!line.catalogItemId) return;
    this.cart.setQuantity(line.catalogItemId, Math.max(1, Math.round(line.quantity + delta)));
  }

  setQuantity(line: ManualOrderLineCommand, value: string): void {
    if (!line.catalogItemId) return;
    const quantity = Number(value);
    this.cart.setQuantity(line.catalogItemId, Number.isFinite(quantity) ? Math.max(1, Math.round(quantity)) : 1);
  }

  save(): void {
    if (!this.draftId || !this.lines().length) return;

    this.saving.set(true);
    this.facade.saveItems(this.draftId, this.lines()).subscribe({
      next: (draft) => {
        this.replaceCartFromDraft(draft, this.facade.state().catalogItems);
        void this.router.navigate(['/ops/commercial/manual-orders', this.draftId, 'delivery']);
      },
      error: () => this.saving.set(false),
    });
  }

  private replaceCartFromDraft(draft: ManualOrderDraft, catalogItems: readonly SalesCommitmentCatalogItem[]): void {
    this.cart.replace(draft.lines.map((line) => this.cartItemFromDraftLine(line, catalogItems)));
  }

  private cartItemFromDraftLine(line: ManualOrderLine, catalogItems: readonly SalesCommitmentCatalogItem[]): ManualOrderCartItem {
    const catalogItem = catalogItems.find((item) => item.id === line.catalogItemId);
    return {
      catalogItemId: line.catalogItemId || line.skuId,
      skuId: line.skuId || null,
      productFamilyName: catalogItem?.productFamilyName || line.productFamily,
      name: catalogItem?.name || line.productFamily,
      presentation: line.presentation || catalogItem?.presentation || line.skuCode,
      unit: line.unit || catalogItem?.unitOfMeasure || 'UNIT',
      quantity: line.quantity,
      // The draft response is authoritative after a save: catalog prices are
      // only a display fallback when a legacy response omits the amount.
      unitPriceAmount: Number.isFinite(line.effectiveUnitPrice)
        ? line.effectiveUnitPrice
        : Number.isFinite(line.baseUnitPrice)
          ? line.baseUnitPrice
          : catalogItem?.unitPrice.amount ?? null,
      currency: line.currency || catalogItem?.unitPrice.currency || 'PEN',
      imageUrl: catalogItem?.image.url ?? null,
      availabilityStatus: line.availabilityStatus || catalogItem?.availabilityStatus || 'UNKNOWN',
      notes: line.notes ?? '',
    };
  }
}
