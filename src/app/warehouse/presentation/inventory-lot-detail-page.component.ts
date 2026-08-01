import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';

@Component({
  selector: 'nexa-inventory-lot-detail-page',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page">
      <nexa-page-header [title]="'warehouse.lots' | translate" [subtitle]="'warehouse.inventory' | translate" />
      @if (facade.loading()) { <nexa-loading-state [label]="'warehouse.loading' | translate" /> }
      @else if (facade.error(); as error) { <nexa-error-state [title]="'warehouse.lots' | translate" [description]="error" (retry)="facade.retry()" /> }
      @else if (lot(); as item) {
        <nexa-section-panel [title]="'warehouse.lots' | translate">
          <dl><dt>{{ 'warehouse.fields.catalog' | translate }}</dt><dd>{{ item.catalogItemId }}</dd><dt>{{ 'warehouse.fields.batch' | translate }}</dt><dd>{{ item.batchNumber }}</dd><dt>{{ 'warehouse.fields.available' | translate }}</dt><dd>{{ item.available }} {{ item.unit }}</dd><dt>{{ 'warehouse.fields.status' | translate }}</dt><dd>{{ ('warehouse.status.' + item.status) | translate }}</dd></dl>
          <button type="button" (click)="command('blocks')" [disabled]="item.status === 'BLOCKED' || !adjustment.controls.reason.value">{{ 'warehouse.actions.block' | translate }}</button><button type="button" (click)="command('quarantines')" [disabled]="item.status === 'QUARANTINED' || !adjustment.controls.reason.value">{{ 'warehouse.actions.quarantine' | translate }}</button><button type="button" (click)="command('availability-restorations')" [disabled]="item.status === 'EXPIRED' || !adjustment.controls.reason.value">{{ 'warehouse.actions.restore' | translate }}</button>
        </nexa-section-panel>
        <nexa-section-panel [title]="'warehouse.actions.adjust' | translate">
          <form [formGroup]="adjustment" (ngSubmit)="adjust(item.version)"><select formControlName="direction"><option value="IN">{{ 'warehouse.forms.increase' | translate }}</option><option value="OUT">{{ 'warehouse.forms.decrease' | translate }}</option></select><input type="number" min="0.0001" formControlName="quantity" [placeholder]="'warehouse.fields.quantity' | translate"><input formControlName="reason" [placeholder]="'warehouse.fields.reason' | translate"><button type="submit" [disabled]="adjustment.invalid">{{ 'warehouse.actions.adjust' | translate }}</button></form>
        </nexa-section-panel>
        <nexa-section-panel [title]="'warehouse.actions.waste' | translate">
          <form [formGroup]="wasteForm" (ngSubmit)="waste(item.version)"><input type="number" min="0.0001" formControlName="quantity" [placeholder]="'warehouse.fields.quantity' | translate"><input formControlName="reason" [placeholder]="'warehouse.fields.reason' | translate"><button type="submit" [disabled]="wasteForm.invalid">{{ 'warehouse.actions.waste' | translate }}</button></form>
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
  readonly lot = this.facade.selectedLot;
  constructor() { this.facade.loadLot(this.id); }
  command(command: 'blocks' | 'quarantines' | 'availability-restorations'): void { const item = this.lot(); const reason = this.adjustment.controls.reason.value.trim(); if (item && reason) this.facade.changeLotStatus(item, command, reason); }
  adjust(version: number): void { if (this.adjustment.invalid) return; this.facade.adjust({ lotId: this.id, ...this.adjustment.getRawValue() }, version); }
  waste(version: number): void { if (this.wasteForm.invalid) return; this.facade.waste({ lotId: this.id, ...this.wasteForm.getRawValue() }, version); }
}
