import type { ManualOrderCartItem } from '../../domain/manual-orders/manual-order-cart.models';

/** Persistence port for the browser-backed manual-order cart adapter. */
export abstract class ManualOrderCartStoragePort {
  abstract read(scope: string): readonly ManualOrderCartItem[];
  abstract write(scope: string, items: readonly ManualOrderCartItem[]): void;
  abstract clear(scope: string): void;
}
