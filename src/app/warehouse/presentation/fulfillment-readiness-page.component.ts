import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { signal } from '@angular/core';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';
import { ReadinessCandidate } from '../domain/warehouse.models';
import { SalesCommitmentApiService } from '../../sales-commitment/infrastructure/http/sales-commitment-api.service';

@Component({
  selector: 'nexa-fulfillment-readiness-page',
  standalone: true,
  imports: [DatePipe, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page">
      <nexa-page-header title="Fulfillment Readiness" subtitle="Reserved orders ready for dispatch" />
      @if (facade.loading()) { <nexa-loading-state /> }
      @else if (facade.error(); as error) { <nexa-error-state title="Readiness unavailable" [description]="error" (retry)="facade.loadReadiness()" /> }
      @else {
        <nexa-section-panel title="Reservation workflow">
          <p>Select a reserved sales order from the server list. The current version is loaded automatically before a write.</p>
          <div class="candidate-list" role="listbox" aria-label="Fulfillment candidates">
            @for (item of facade.readiness(); track item.reservationId) {
              <button type="button" class="candidate" [class.selected]="selectedCandidate()?.reservationId === item.reservationId" (click)="select(item)">
                <span><strong>{{ item.orderNumber }}</strong><small>{{ item.clientAccountId }} · {{ item.lineCount }} lines</small></span><span>{{ item.status }}</span>
              </button>
            } @empty { <p role="status">No fulfillment candidates are currently ready.</p> }
          </div>
          @if (selectedCandidate(); as candidate) {
            <div class="selection-summary"><strong>{{ candidate.orderNumber }}</strong><span>Reservation {{ candidate.reservationId }}</span>@if (loadingVersion()) { <span role="status">Loading current order version…</span> } @else if (salesOrderVersion() !== null) { <span>Version {{ salesOrderVersion() }}</span> }</div>
            <button type="button" (click)="preview()" [disabled]="loadingVersion()">Preview FEFO</button>
          }
          @if (facade.previewResult(); as preview) {
            <p>{{ preview.orderNumber }} · {{ preview.complete ? 'Ready' : 'Shortage' }}</p>
            <p>{{ preview.notice }}</p>
            <ul>@for (line of preview.lines; track line.catalogItemId) { <li>{{ line.catalogItemId }} · requested {{ line.requested }} · allocated {{ line.allocations.length }} · shortage {{ line.shortage }}</li> }</ul>
            <button type="button" (click)="reserve()" [disabled]="!preview.complete || !facade.canWrite() || salesOrderVersion() === null">Reserve inventory</button>
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
  styles: [`p{max-width:70ch}.candidate-list{display:grid;gap:.5rem;margin:1rem 0}.candidate{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:.75rem;border:1px solid #dbe3ee;border-radius:.5rem;background:#fff;text-align:left;cursor:pointer}.candidate.selected{border-color:#2166c1;background:#eef5ff}.candidate span{display:grid;gap:.2rem}.candidate small{color:#64748b}.selection-summary{display:flex;gap:.75rem;flex-wrap:wrap;margin:.75rem 0;padding:.75rem;background:#f8fafc;border-radius:.5rem}button{padding:.55rem .8rem;border:0;border-radius:.4rem;background:#2166c1;color:#fff;cursor:pointer}button:disabled{opacity:.55;cursor:not-allowed}table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #ddd}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FulfillmentReadinessPageComponent {
  readonly facade = inject(WarehouseOperationsFacade);
  private readonly salesApi = inject(SalesCommitmentApiService);
  readonly selectedCandidate = signal<ReadinessCandidate | null>(null);
  readonly salesOrderVersion = signal<number | null>(null);
  readonly loadingVersion = signal(false);

  constructor() { this.facade.loadReadiness(); }
  select(candidate: ReadinessCandidate): void {
    this.selectedCandidate.set(candidate);
    this.salesOrderVersion.set(null);
    this.facade.previewResult.set(null);
    this.loadingVersion.set(true);
    this.salesApi.salesOrder(candidate.salesOrderId).subscribe({ next: (order) => { this.salesOrderVersion.set(order.version); this.loadingVersion.set(false); }, error: () => this.loadingVersion.set(false) });
  }
  preview(): void { const candidate = this.selectedCandidate(); if (!candidate) return; this.facade.previewResult.set(null); this.facade.preview(candidate.salesOrderId); }
  reserve(): void { const candidate = this.selectedCandidate(); const version = this.salesOrderVersion(); if (!candidate || version === null) return; this.facade.reserve(candidate.salesOrderId, version); }
}
