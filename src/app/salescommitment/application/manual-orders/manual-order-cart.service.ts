import { computed, inject, Injectable, signal } from '@angular/core';
import { ManualOrderCartPort } from '../ports/manual-order-cart.port';
import { ManualOrderCartStoragePort } from '../ports/manual-order-cart-storage.port';
import type { ManualOrderCartItem } from '../../domain/manual-orders/manual-order-cart.models';

@Injectable({ providedIn: 'root' })
export class ManualOrderCartService extends ManualOrderCartPort {
  private readonly storage = inject(ManualOrderCartStoragePort);
  private readonly itemsState = signal<readonly ManualOrderCartItem[]>([]);
  private scope = '';

  readonly items = this.itemsState.asReadonly();
  readonly count = computed(() => this.itemsState().reduce((total, item) => total + item.quantity, 0));
  readonly subtotal = computed(() => this.itemsState().reduce(
    (total, item) => total + (item.unitPriceAmount ?? 0) * item.quantity,
    0,
  ));

  setScope(scope: string | null): void {
    const nextScope = scope?.trim() ?? '';
    if (nextScope === this.scope) return;
    this.scope = nextScope;
    this.itemsState.set(nextScope ? this.storage.read(nextScope) : []);
  }

  add(item: ManualOrderCartItem): void {
    if (!this.scope || item.quantity <= 0) return;
    const current = this.itemsState();
    const existing = current.find((candidate) => candidate.catalogItemId === item.catalogItemId);
    const next = existing
      ? current.map((candidate) => candidate.catalogItemId === item.catalogItemId
        ? { ...candidate, quantity: candidate.quantity + item.quantity }
        : candidate)
      : [...current, { ...item, quantity: item.quantity }];
    this.persist(next);
  }

  remove(catalogItemId: string): void {
    this.persist(this.itemsState().filter((item) => item.catalogItemId !== catalogItemId));
  }

  setQuantity(catalogItemId: string, quantity: number): void {
    const normalized = Number.isFinite(quantity) ? Math.max(0.01, quantity) : 0.01;
    this.persist(this.itemsState().map((item) => item.catalogItemId === catalogItemId
      ? { ...item, quantity: Number(normalized.toFixed(2)) }
      : item));
  }

  replace(items: readonly ManualOrderCartItem[]): void {
    const unique = new Map<string, ManualOrderCartItem>();
    for (const item of items) {
      if (!item.catalogItemId || item.quantity <= 0) continue;
      unique.set(item.catalogItemId, { ...item, quantity: Number(item.quantity.toFixed(2)) });
    }
    this.persist([...unique.values()]);
  }

  clear(): void {
    this.itemsState.set([]);
    if (this.scope) this.storage.clear(this.scope);
  }

  private persist(items: readonly ManualOrderCartItem[]): void {
    this.itemsState.set(items);
    if (this.scope) this.storage.write(this.scope, items);
  }
}
