import type { Signal } from '@angular/core';
import type { ManualOrderCartItem } from '../../domain/manual-orders/manual-order-cart.models';

/** Application port for the manual Sales Order catalog cart. */
export abstract class ManualOrderCartPort {
  abstract readonly items: Signal<readonly ManualOrderCartItem[]>;
  abstract readonly count: Signal<number>;
  abstract readonly subtotal: Signal<number>;
  abstract setScope(scope: string | null): void;
  abstract add(item: ManualOrderCartItem): void;
  abstract remove(catalogItemId: string): void;
  abstract setQuantity(catalogItemId: string, quantity: number): void;
  abstract replace(items: readonly ManualOrderCartItem[]): void;
  abstract clear(): void;
}
