import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { ManualOrderWizardFacade } from '../../application/manual-orders/manual-order-wizard.facade';

@Component({
  selector: 'nexa-manual-order-client-page',
  standalone: true,
  imports: [DecimalPipe, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, PageHeaderComponent, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <a mat-button routerLink="/ops/commercial/purchase-requests">Volver a solicitudes</a>
      <nexa-page-header eyebrow="VENTAS · PASO 1/4" title="Cliente y condiciones" subtitle="El servidor conserva el borrador y valida la condición comercial." />
      <nav class="steps" aria-label="Pasos de orden manual"><a class="active">Cliente</a><a [routerLink]="itemsPath()">Ítems</a><a [routerLink]="deliveryPath()">Entrega</a><a [routerLink]="reviewPath()">Revisión</a></nav>
      <mat-card>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
            <mat-form-field appearance="outline"><mat-label>Cliente</mat-label><mat-select formControlName="clientAccountId" (selectionChange)="clientChanged($event.value)"><mat-option value="">Seleccionar cliente</mat-option>@for (client of facade.state().clients; track client.id) { <mat-option [value]="client.id">{{ client.commercialName || client.businessName }} · {{ client.code }}</mat-option> }</mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Fecha solicitada</mat-label><input matInput type="date" formControlName="requestedDeliveryDate" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Prioridad</mat-label><mat-select formControlName="priority"><mat-option value="NORMAL">Normal</mat-option><mat-option value="HIGH">Alta</mat-option><mat-option value="URGENT">Urgente</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Condición de pago</mat-label><mat-select formControlName="paymentPreference"><mat-option value="CREDIT_LINE">Línea de crédito</mat-option><mat-option value="BANK_TRANSFER">Transferencia bancaria</mat-option><mat-option value="CASH">Contado</mat-option><mat-option value="CASH_ON_DELIVERY">Contra entrega</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Moneda</mat-label><input matInput maxlength="3" formControlName="currency" /></mat-form-field>
            <mat-form-field appearance="outline" class="wide"><mat-label>Notas comerciales</mat-label><textarea matInput rows="3" formControlName="notes"></textarea></mat-form-field>
          </form>
          @if (selectedClient(); as client) { <div class="client-summary"><strong>{{ client.commercialName || client.businessName }}</strong><span>{{ client.code }} · {{ client.taxType }} {{ client.taxValue }}</span><span>Condición comercial: {{ client.paymentCondition || 'No definida' }}</span><span>Direcciones activas: {{ facade.state().addresses.length }}</span></div> }
          @if (facade.state().draft?.client; as client) { <div class="server-summary"><span>Estado: {{ client.status }}</span><span>Términos: {{ client.paymentTerms || 'No definidos' }}</span><span>Límite: {{ client.creditLimit | number:'1.2-2' }} · Exposición: {{ client.currentExposure | number:'1.2-2' }} · Disponible: {{ client.availableCredit | number:'1.2-2' }}</span></div> }
          @if (facade.state().addresses.length) { <div class="address-list"><strong>Direcciones disponibles</strong>@for (address of facade.state().addresses; track address.id) { <span>{{ address.label }} · {{ address.line }}</span> }</div> }
          @if (facade.state().message; as message) { <p role="alert">{{ message }}</p> }
        </mat-card-content>
        <mat-card-actions><button mat-stroked-button type="button" (click)="abandon()">Abandonar</button><button mat-flat-button color="primary" type="button" [disabled]="saving()" (click)="save()">{{ saving() ? 'Guardando…' : 'Guardar y continuar' }}</button></mat-card-actions>
      </mat-card>
    </section>
  `,
  styleUrl: './manual-order-wizard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualOrderClientPageComponent {
  readonly facade = inject(ManualOrderWizardFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly draftId = this.route.snapshot.paramMap.get('draftId') ?? '';
  readonly saving = signal(false);
  private loadedClientId: string | null = null;
  private hydratedDraftId: string | null = null;
  readonly form = this.fb.nonNullable.group({
    clientAccountId: ['', Validators.required],
    requestedDeliveryDate: [tomorrow(), Validators.required],
    priority: ['NORMAL', Validators.required],
    paymentPreference: ['CREDIT_LINE', Validators.required],
    currency: ['PEN', [Validators.required, Validators.maxLength(3)]],
    notes: ['']
  });

  constructor() {
    this.facade.loadReferences();
    if (this.draftId) this.facade.loadDraft(this.draftId);
    effect(() => {
      const draft = this.facade.state().draft;
      if (draft?.id === this.draftId && this.hydratedDraftId !== draft.id) {
        this.form.patchValue({
          clientAccountId: draft.client?.id ?? '', requestedDeliveryDate: draft.requestedDeliveryDate ?? tomorrow(),
          priority: draft.priority || 'NORMAL', paymentPreference: draft.paymentPreference ?? 'CREDIT_LINE',
          currency: draft.currency || 'PEN', notes: draft.notes ?? ''
        }, { emitEvent: false });
        this.hydratedDraftId = draft.id;
      }
      const clientId = draft?.client?.id ?? null;
      if (clientId && clientId !== this.loadedClientId) { this.loadedClientId = clientId; this.facade.loadAddresses(clientId); }
    });
  }

  selectedClient() { return this.facade.state().clients.find((client) => client.id === this.form.controls.clientAccountId.value) ?? null; }
  clientChanged(clientId: string): void { if (clientId) this.facade.loadAddresses(clientId); }
  itemsPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/items`; }
  deliveryPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/delivery`; }
  reviewPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/review`; }

  save(): void {
    if (this.form.invalid || !this.draftId) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.facade.saveClient(this.draftId, this.form.getRawValue()).subscribe({
      next: () => void this.router.navigate(['/ops/commercial/manual-orders', this.draftId, 'items']),
      error: () => this.saving.set(false)
    });
  }

  abandon(): void {
    if (!this.draftId) return;
    this.facade.abandon(this.draftId).subscribe({ next: () => void this.router.navigate(['/ops/commercial/purchase-requests']) });
  }
}

function tomorrow(): string {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  return value.toISOString().slice(0, 10);
}
