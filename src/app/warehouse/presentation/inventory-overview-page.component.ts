import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';

@Component({
  selector: 'nexa-inventory-overview-page',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page">
      <nexa-page-header title="Inventory Control" subtitle="Inbound receipts and lot quantities are returned by the warehouse API" />
      @if (facade.loading()) { <nexa-loading-state /> }
      @else if (facade.error(); as error) { <nexa-error-state title="Inventory unavailable" [description]="error" (retry)="facade.retry()" /> }
      @else {
        <nexa-section-panel title="Inbound receipt">
          <form [formGroup]="receipt" (ngSubmit)="receive()"><input formControlName="warehouseId" placeholder="Warehouse ID"><input formControlName="zoneId" placeholder="Zone ID"><input formControlName="catalogItemId" placeholder="Catalog item"><input formControlName="batchNumber" placeholder="Batch"><input type="date" formControlName="expirationDate"><input type="number" min="0.0001" formControlName="quantity" placeholder="Quantity"><input formControlName="unit" placeholder="Unit"><input type="number" formControlName="temperatureValue" placeholder="Temperature"><button type="submit" [disabled]="receipt.invalid">Register inbound</button></form>
        </nexa-section-panel>
        <nexa-section-panel title="Current inventory">
          <table><thead><tr><th>Catalog</th><th>Batch</th><th>Expiration</th><th>Available</th><th>Status</th></tr></thead><tbody>
            @for (lot of facade.lots(); track lot.id) { <tr><td>{{ lot.catalogItemId }}</td><td>{{ lot.batchNumber }}</td><td>{{ lot.expirationDate | date:'mediumDate' }}</td><td>{{ lot.available }} {{ lot.unit }}</td><td>{{ lot.status }}</td></tr> }
            @empty { <tr><td colspan="5">No inventory lots found.</td></tr> }
          </tbody></table>
        </nexa-section-panel>
      }
    </section>
  `,
  styles: [`form{display:flex;gap:.5rem;flex-wrap:wrap}input{padding:.55rem}table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #ddd}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryOverviewPageComponent {
  readonly facade = inject(WarehouseOperationsFacade);
  private readonly fb = inject(FormBuilder);
  readonly receipt = this.fb.nonNullable.group({ warehouseId: ['', Validators.required], zoneId: ['', Validators.required], catalogItemId: ['', Validators.required], batchNumber: ['', Validators.required], expirationDate: ['', Validators.required], quantity: [1, [Validators.required, Validators.min(0.0001)]], unit: ['UNIT', Validators.required], temperatureValue: [null as number | null] });
  constructor() { this.facade.load(); }
  receive(): void { if (this.receipt.invalid) return; const value = this.receipt.getRawValue(); this.facade.receive({ ...value, temperatureValue: value.temperatureValue ?? undefined }); }
}
