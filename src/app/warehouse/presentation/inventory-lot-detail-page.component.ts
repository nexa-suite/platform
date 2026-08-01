import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';

@Component({
  selector: 'nexa-inventory-lot-detail-page',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page">
      <nexa-page-header title="Inventory Lot Detail" subtitle="Transactions and explicit status commands preserve append-only history" />
      @if (facade.loading()) { <nexa-loading-state /> }
      @else if (facade.error(); as error) { <nexa-error-state title="Lot unavailable" [description]="error" (retry)="facade.retry()" /> }
      @else if (lot(); as item) {
        <nexa-section-panel title="Lot">
          <dl><dt>Catalog</dt><dd>{{ item.catalogItemId }}</dd><dt>Batch</dt><dd>{{ item.batchNumber }}</dd><dt>Available</dt><dd>{{ item.available }} {{ item.unit }}</dd><dt>Status</dt><dd>{{ item.status }}</dd></dl>
          <button type="button" (click)="command('blocks')" [disabled]="item.status === 'BLOCKED'">Block</button><button type="button" (click)="command('quarantines')" [disabled]="item.status === 'QUARANTINED'">Quarantine</button><button type="button" (click)="command('availability-restorations')" [disabled]="item.status === 'EXPIRED'">Restore availability</button>
        </nexa-section-panel>
        <nexa-section-panel title="Adjustment">
          <form [formGroup]="adjustment" (ngSubmit)="adjust(item.version)"><select formControlName="direction"><option value="IN">Increase</option><option value="OUT">Decrease</option></select><input type="number" min="0.0001" formControlName="quantity" placeholder="Quantity"><input formControlName="reason" placeholder="Reason"><button type="submit" [disabled]="adjustment.invalid">Apply adjustment</button></form>
        </nexa-section-panel>
        <nexa-section-panel title="Waste">
          <form [formGroup]="wasteForm" (ngSubmit)="waste(item.version)"><input type="number" min="0.0001" formControlName="quantity" placeholder="Quantity"><input formControlName="reason" placeholder="Reason"><button type="submit" [disabled]="wasteForm.invalid">Record waste</button></form>
        </nexa-section-panel>
      } @else { <p>Lot not found in the current page.</p> }
    </section>
  `,
  styles: [`dl{display:grid;grid-template-columns:max-content 1fr;gap:.4rem 1rem}form{display:flex;gap:.5rem;flex-wrap:wrap}input,select{padding:.55rem}button{margin-right:.5rem}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryLotDetailPageComponent {
  readonly facade = inject(WarehouseOperationsFacade);
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('lotId')!;
  private readonly fb = inject(FormBuilder);
  readonly adjustment = this.fb.nonNullable.group({ direction: ['IN' as 'IN' | 'OUT', Validators.required], quantity: [1, [Validators.required, Validators.min(0.0001)]], reason: ['', Validators.required] });
  readonly wasteForm = this.fb.nonNullable.group({ quantity: [1, [Validators.required, Validators.min(0.0001)]], reason: ['', Validators.required] });
  readonly lot = computed(() => this.facade.lots().find((item) => item.id === this.id));
  constructor() { this.facade.load(); }
  command(command: 'blocks' | 'quarantines' | 'availability-restorations'): void { const item = this.lot(); if (item) this.facade.changeLotStatus(item, command, 'Warehouse operator action'); }
  adjust(version: number): void { if (this.adjustment.invalid) return; this.facade.adjust({ lotId: this.id, ...this.adjustment.getRawValue() }, version); }
  waste(version: number): void { if (this.wasteForm.invalid) return; this.facade.waste({ lotId: this.id, ...this.wasteForm.getRawValue() }, version); }
}
