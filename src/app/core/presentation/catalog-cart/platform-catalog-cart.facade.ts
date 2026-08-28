import { Injectable, inject } from '@angular/core';
import { PlatformAuthenticationBoundary } from '../../security/platform-authentication.boundary';
import { ManualOrderCartPort } from '../../../salescommitment/application/ports/manual-order-cart.port';
import type { ManualOrderCartItem } from '../../../salescommitment/domain/manual-orders/manual-order-cart.models';
import type { ProductCatalogItem } from '../../../catalogcommercialpolicy/domain/models/catalog.models';

/** Composition ACL from the BC-03 catalog UI to the BC-04 manual-order cart. */
@Injectable({ providedIn: 'root' })
export class PlatformCatalogCartFacade {
  private readonly auth = inject(PlatformAuthenticationBoundary);
  private readonly cart = inject(ManualOrderCartPort);

  readonly items = this.cart.items;
  readonly count = this.cart.count;
  readonly subtotal = this.cart.subtotal;

  activate(draftId?: string | null): void {
    const user = this.auth.currentUser();
    const draftScope = draftId?.trim() ? `:manual-order:${draftId.trim()}` : '';
    this.cart.setScope(user ? `${user.workspaceSlug}:${user.subject}${draftScope}` : null);
  }

  has(catalogItemId: string): boolean {
    return this.items().some((item) => item.catalogItemId === catalogItemId);
  }

  toggle(item: ProductCatalogItem): boolean {
    if (this.has(item.id)) {
      this.cart.remove(item.id);
      return true;
    }
    return this.add(item);
  }

  add(item: ProductCatalogItem, quantity = 1): boolean {
    if (['OUT_OF_STOCK', 'UNAVAILABLE', 'OUT'].includes(item.availabilityStatus.toUpperCase())) return false;
    const cartItem: ManualOrderCartItem = {
      catalogItemId: item.id,
      skuId: item.sellableSkuId,
      productFamilyName: item.productFamilyName,
      name: item.name,
      presentation: item.presentation,
      unit: item.unitOfMeasure || 'UNIT',
      quantity,
      unitPriceAmount: Number.isFinite(item.unitPrice.amount) ? item.unitPrice.amount : null,
      currency: item.unitPrice.currency || 'PEN',
      imageUrl: item.image.url,
      availabilityStatus: item.availabilityStatus,
      notes: '',
    };
    this.cart.add(cartItem);
    return true;
  }

  remove(catalogItemId: string): void { this.cart.remove(catalogItemId); }
  setQuantity(catalogItemId: string, quantity: number): void { this.cart.setQuantity(catalogItemId, quantity); }
  replace(items: readonly ManualOrderCartItem[]): void { this.cart.replace(items); }
  clear(): void { this.cart.clear(); }
}
