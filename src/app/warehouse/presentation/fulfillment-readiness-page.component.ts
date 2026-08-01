import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';

@Component({
  selector: 'nexa-fulfillment-readiness-page',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page">
      <nexa-page-header title="Fulfillment Readiness" subtitle="Reserved orders ready for dispatch" />
      @if (facade.loading()) { <nexa-loading-state /> }
      @else if (facade.error(); as error) { <nexa-error-state title="Readiness unavailable" [description]="error" (retry)="facade.loadReadiness()" /> }
      @else {
        <nexa-section-panel title="Reservation workflow">
          <form [formGroup]="reservationForm" (ngSubmit)="preview()">
            <input formControlName="salesOrderId" placeholder="Sales order ID" aria-label="Sales order ID">
            <input type="number" formControlName="salesOrderVersion" min="0" placeholder="Sales order version" aria-label="Sales order version">
            <button type="submit" [disabled]="reservationForm.invalid">Preview FEFO</button>
          </form>
          @if (facade.previewResult(); as preview) {
            <p>{{ preview.orderNumber }} · {{ preview.complete ? 'Ready' : 'Shortage' }}</p>
            <p>{{ preview.notice }}</p>
            <ul>@for (line of preview.lines; track line.catalogItemId) { <li>{{ line.catalogItemId }} · requested {{ line.requested }} · allocated {{ line.allocations.length }} · shortage {{ line.shortage }}</li> }</ul>
            <button type="button" (click)="reserve()" [disabled]="!preview.complete">Reserve inventory</button>
          }
        </nexa-section-panel>
        <nexa-section-panel title="Ready reservations">
          <table><thead><tr><th>Order</th><th>Lines</th><th>Reserved quantity</th><th>Expires</th></tr></thead><tbody>
            @for (item of facade.readiness(); track item.reservationId) { <tr><td>{{ item.orderNumber }}</td><td>{{ item.lineCount }}</td><td>{{ item.totalReservedQuantity }}</td><td>{{ item.expiresAt | date:'short' }}</td></tr> }
          </tbody></table>
        </nexa-section-panel>
      }
    </section>
  `,
  styles: [`form{display:flex;gap:.5rem;flex-wrap:wrap}input{padding:.55rem}table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #ddd}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FulfillmentReadinessPageComponent {
  readonly facade = inject(WarehouseOperationsFacade);
  private readonly fb = inject(FormBuilder);
  readonly reservationForm = this.fb.nonNullable.group({ salesOrderId: ['', Validators.required], salesOrderVersion: [1, [Validators.required, Validators.min(0)]] });

  constructor() { this.facade.loadReadiness(); }
  preview(): void { if (this.reservationForm.invalid) return; this.facade.previewResult.set(null); this.facade.preview(this.reservationForm.controls.salesOrderId.value.trim()); }
  reserve(): void { if (this.reservationForm.invalid) return; this.facade.reserve(this.reservationForm.controls.salesOrderId.value.trim(), this.reservationForm.controls.salesOrderVersion.value); }
}
