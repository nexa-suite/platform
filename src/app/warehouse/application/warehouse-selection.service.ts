import { Injectable, signal } from '@angular/core';

/** Session-scoped warehouse context. Persistence remains governed by tenant operational settings. */
@Injectable({ providedIn: 'root' })
export class WarehouseSelectionService {
  private readonly selectedIdSignal = signal<string | null>(null);
  readonly selectedId = this.selectedIdSignal.asReadonly();

  select(id: string): void { this.selectedIdSignal.set(id); }
  clear(): void { this.selectedIdSignal.set(null); }
}
