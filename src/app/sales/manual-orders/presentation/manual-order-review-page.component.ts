import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { ManualOrderWizardFacade } from '../application/manual-order-wizard.facade';

@Component({
  selector: 'nexa-manual-order-review-page',
  standalone: true,
  imports: [DecimalPipe, MatButtonModule, MatCardModule, PageHeaderComponent, RouterLink],
  template: `
    <section class="page">
      <a mat-button [routerLink]="deliveryPath()">← Entrega</a>
      <nexa-page-header eyebrow="VENTAS · PASO 4/4" title="Revisión y creación" subtitle="Solo se crea el Sales Order cuando el servidor marca el draft como listo." />
      <nav class="steps" aria-label="Pasos de orden manual"><a [routerLink]="clientPath()">Cliente</a><a [routerLink]="itemsPath()">Ítems</a><a [routerLink]="deliveryPath()">Entrega</a><a class="active">Revisión</a></nav>
      @if (review(); as data) {
        <mat-card><mat-card-header><mat-card-title>Estado: {{ data.draft.status }}</mat-card-title></mat-card-header><mat-card-content>
          <div class="readiness"><span>Cliente: {{ data.clientComplete ? 'OK' : 'Pendiente' }}</span><span>Ítems: {{ data.itemsComplete ? 'OK' : 'Pendiente' }}</span><span>Entrega: {{ data.deliveryComplete ? 'OK' : 'Pendiente' }}</span></div>
          @if (data.missing.length) { <p class="warning">Falta completar: {{ data.missing.join(', ') }}.</p> }
          <h3>Cliente</h3><p>{{ data.draft.client?.commercialName || data.draft.client?.businessName }} · {{ data.draft.client?.code }}</p>
          <p>Tax ID: {{ data.draft.client?.taxIdentifierType }} {{ data.draft.client?.taxIdentifierValue }} · estado {{ data.draft.client?.status }}</p>
          <p>Fecha solicitada: {{ data.draft.requestedDeliveryDate }} · prioridad {{ data.draft.priority }} · pago {{ data.draft.paymentPreference }} · moneda {{ data.draft.currency }}</p>
          <p>Crédito: {{ data.draft.creditResult || 'Pendiente' }} · disponible {{ data.draft.client?.availableCredit | number:'1.2-2' }}</p>
          <h3>Ítems y precios autoritativos</h3>
          @for (line of data.draft.lines; track line.id) { <div class="line"><span>{{ line.productFamily }} · {{ line.familyCode }} · SKU {{ line.skuCode }} · {{ line.presentation }} · {{ line.quantity }} {{ line.unit }}</span><span>Base {{ line.baseUnitPrice | number:'1.2-2' }} · efectivo {{ line.effectiveUnitPrice * line.quantity | number:'1.2-2' }} · descuento {{ line.discountAmount | number:'1.2-2' }} {{ line.currency }} · {{ line.availabilityStatus }}</span></div> }
          <p class="total">Total estimado por líneas: {{ total() | number:'1.2-2' }} {{ data.draft.currency }}</p>
          <h3>Entrega</h3><p>{{ data.draft.delivery?.addressSnapshot || 'Pendiente' }}</p><p>Almacén y ruta: {{ data.draft.delivery?.warehouseId || 'Pendiente' }} · {{ data.draft.delivery?.routeProvider || 'Pendiente' }}</p>
          <p>Distancia: {{ routeValue(data.draft.delivery?.routeSnapshot, 'distanceKm') || '—' }} km · duración: {{ routeValue(data.draft.delivery?.routeSnapshot, 'durationSeconds') || '—' }} s</p>
          @if (facade.state().message; as message) { <p role="alert">{{ message }}</p> }
        </mat-card-content><mat-card-actions><button mat-stroked-button type="button" (click)="abandon()">Abandonar</button><button mat-flat-button color="primary" type="button" [disabled]="submitting() || !data.readyToCreate" (click)="submit()">{{ submitting() ? 'Creando…' : 'Crear Sales Order' }}</button></mat-card-actions></mat-card>
      } @else { <p>Cargando revisión del servidor…</p> }
    </section>
  `,
  styles: [`.page{display:grid;gap:16px;max-width:1100px;margin:auto;padding:32px}.steps{display:flex;gap:8px}.steps a{padding:8px 12px;border:1px solid #dbe3ee;border-radius:6px;text-decoration:none}.steps .active{background:#ecfdf5;border-color:#0f766e}.readiness{display:flex;gap:12px;flex-wrap:wrap}.readiness span{padding:8px 12px;background:#f1f5f9;border-radius:6px}.warning{padding:12px;background:#fff7ed;color:#9a3412;border-radius:6px}.line{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #e2e8f0}.total{font-weight:700;text-align:right}.mat-mdc-card-actions{justify-content:space-between;padding:16px}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualOrderReviewPageComponent {
  readonly facade = inject(ManualOrderWizardFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly draftId = this.route.snapshot.paramMap.get('draftId') ?? '';
  readonly submitting = signal(false);
  readonly review = computed(() => this.facade.state().review);

  constructor() { if (this.draftId) this.facade.loadReview(this.draftId); }

  clientPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/client`; }
  itemsPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/items`; }
  deliveryPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/delivery`; }
  total(): number { return this.review()?.draft.lines.reduce((sum, line) => sum + line.effectiveUnitPrice * line.quantity, 0) ?? 0; }
  routeValue(snapshot: string | null | undefined, key: string): string {
    if (!snapshot) return '';
    try {
      const value = JSON.parse(snapshot) as Record<string, unknown>;
      return value[key] === null || value[key] === undefined ? '' : String(value[key]);
    } catch {
      return '';
    }
  }

  submit(): void {
    if (!this.draftId || !this.review()?.readyToCreate) return;
    this.submitting.set(true);
    this.facade.submit(this.draftId).subscribe({
      next: (order) => void this.router.navigate(['/ops/commercial/sales-orders', order.id]),
      error: () => this.submitting.set(false)
    });
  }

  abandon(): void {
    if (!this.draftId) return;
    this.facade.abandon(this.draftId).subscribe({ next: () => void this.router.navigate(['/ops/commercial/purchase-requests']) });
  }
}
