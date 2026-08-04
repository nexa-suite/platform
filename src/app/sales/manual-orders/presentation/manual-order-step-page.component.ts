import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { RequestBuilderFacade } from '../../purchase-requests/application/request-builder.facade';
import { ManualOrderWizardStateService, ManualOrderPriority, ManualOrderWizardStep } from '../application/manual-order-wizard-state.service';
import { ManualOrderDraftApiService } from '../infrastructure/manual-order-draft-api.service';

@Component({
  selector: 'nexa-manual-order-step-page',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, PageHeaderComponent, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <nexa-page-header eyebrow="VENTAS" [title]="title()" subtitle="Sales Order manual" />
      <nav class="steps" aria-label="Manual Sales Order steps">
        @for (entry of steps; track entry) { <a [class.active]="entry === step" [routerLink]="wizard.path(entry)">{{ entry }}</a> }
      </nav>

      @if (step === 'client') {
        <mat-card><mat-card-header><mat-card-title>1. Cliente</mat-card-title></mat-card-header><mat-card-content>
          <form [formGroup]="clientForm" (ngSubmit)="saveClient()">
            <mat-form-field appearance="outline"><mat-label>Cliente</mat-label><mat-select formControlName="clientAccountId"><mat-option value="">Seleccionar cliente</mat-option>@for (client of clients(); track client.id) { <mat-option [value]="client.id">{{ client.commercialName }} · {{ client.code }}</mat-option> }</mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Fecha de entrega</mat-label><input matInput type="date" formControlName="requestedDeliveryDate" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Prioridad</mat-label><mat-select formControlName="priority"><mat-option value="NORMAL">Normal</mat-option><mat-option value="HIGH">Alta</mat-option><mat-option value="URGENT">Urgente</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Condición de pago</mat-label><mat-select formControlName="paymentOption"><mat-option value="CREDIT_LINE">Crédito</mat-option><mat-option value="BANK_TRANSFER">Transferencia</mat-option><mat-option value="CASH">Contado</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Notas comerciales</mat-label><textarea matInput rows="3" formControlName="notes"></textarea></mat-form-field>
            <button mat-flat-button color="primary" type="submit">Guardar y continuar</button>
          </form>
        </mat-card-content></mat-card>
      }

      @if (step === 'items') {
        <mat-card><mat-card-header><mat-card-title>2. Ítems</mat-card-title></mat-card-header><mat-card-content>
          <form [formGroup]="lineForm" (ngSubmit)="addLine()" class="line-form">
            <mat-form-field appearance="outline"><mat-label>SKU / catálogo</mat-label><mat-select formControlName="catalogItemId"><mat-option value="">Seleccionar ítem</mat-option>@for (item of catalogItems(); track item.id) { <mat-option [value]="item.id">{{ item.name }} · {{ item.presentation }}</mat-option> }</mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Cantidad</mat-label><input matInput type="number" min="0.01" step="0.01" formControlName="quantity" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Unidad</mat-label><input matInput formControlName="unit" /></mat-form-field>
            <button mat-stroked-button type="submit">Agregar ítem</button>
          </form>
          <ul>@for (line of state().lines; track line.catalogItemId) { <li>{{ line.catalogItemId }} · {{ line.quantity }} {{ line.unit }}</li> }</ul>
          <button mat-flat-button color="primary" type="button" [disabled]="!state().lines.length || saving()" (click)="saveItems()">Guardar y continuar</button>
        </mat-card-content></mat-card>
      }

      @if (step === 'delivery') {
        <mat-card><mat-card-header><mat-card-title>3. Entrega y fulfillment</mat-card-title></mat-card-header><mat-card-content>
          <form [formGroup]="deliveryForm" (ngSubmit)="saveDelivery()">
            <mat-form-field appearance="outline"><mat-label>Dirección guardada</mat-label><input matInput formControlName="addressId" placeholder="ID de dirección" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Almacén</mat-label><input matInput formControlName="warehouseId" placeholder="ID de almacén" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Proveedor de ruta</mat-label><input matInput formControlName="routeProvider" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Notas de entrega</mat-label><textarea matInput rows="3" formControlName="deliveryNotes"></textarea></mat-form-field>
            <button mat-flat-button color="primary" type="submit">Guardar y continuar</button>
          </form>
        </mat-card-content></mat-card>
      }

      @if (step === 'review') {
        <mat-card><mat-card-header><mat-card-title>4. Revisión y creación</mat-card-title></mat-card-header><mat-card-content>
          <dl><div><dt>Cliente</dt><dd>{{ selectedClientLabel() }}</dd></div><div><dt>Ítems</dt><dd>{{ state().lines.length }}</dd></div><div><dt>Entrega</dt><dd>{{ state().warehouseId || 'Pendiente' }}</dd></div><div><dt>Total</dt><dd>Calculado por API</dd></div></dl>
          <p role="note">El backend valida disponibilidad, snapshots, crédito, idempotencia y transición a Sales Order.</p>
          <button mat-flat-button color="primary" type="button" [disabled]="!ready() || saving()" (click)="createOrder()">{{ saving() ? 'Creando…' : 'Crear Sales Order' }}</button>
        </mat-card-content></mat-card>
      }
      @if (message(); as value) { <p role="alert">{{ value }}</p> }
    </section>
  `,
  styles: [`.page{display:grid;gap:16px;max-width:1000px;margin:auto;padding:32px}.steps{display:flex;gap:8px;flex-wrap:wrap}.steps a{padding:8px 12px;border:1px solid #dbe3ee;border-radius:6px;text-decoration:none}.steps a.active{border-color:#0f766e;background:#ecfdf5}.mat-mdc-form-field{margin:8px}.line-form{display:flex;align-items:center;gap:8px;flex-wrap:wrap}dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}dt{color:#64748b}dd{margin:0;font-weight:600}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualOrderStepPageComponent {
  readonly steps: readonly ManualOrderWizardStep[] = ['client', 'items', 'delivery', 'review'];
  private readonly route = inject(ActivatedRoute);
  readonly step = (this.route.snapshot.data['step'] ?? this.route.snapshot.paramMap.get('step') ?? 'client') as ManualOrderWizardStep;
  private readonly router = inject(Router);
  readonly wizard = inject(ManualOrderWizardStateService);
  private readonly facade = inject(RequestBuilderFacade);
  private readonly draftApi = inject(ManualOrderDraftApiService);
  readonly state = this.wizard.state;
  readonly clients = computed(() => this.facade.state().clients);
  readonly catalogItems = computed(() => this.facade.state().catalogItems);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly clientForm = new FormGroup({
    clientAccountId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    requestedDeliveryDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    priority: new FormControl<ManualOrderPriority>('NORMAL', { nonNullable: true, validators: [Validators.required] }),
    paymentOption: new FormControl('CREDIT_LINE', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true }),
  });
  readonly lineForm = new FormGroup({
    catalogItemId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    quantity: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
    unit: new FormControl('UNIT', { nonNullable: true, validators: [Validators.required] }),
  });
  readonly deliveryForm = new FormGroup({
    addressId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    warehouseId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    routeProvider: new FormControl('', { nonNullable: true }),
    deliveryNotes: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.wizard.start(this.route.snapshot.paramMap.get('draftId'));
    this.facade.loadReferences();
    const current = this.state();
    this.clientForm.patchValue({ clientAccountId: current.clientAccountId, requestedDeliveryDate: current.requestedDeliveryDate, priority: current.priority, paymentOption: current.paymentOption, notes: current.notes });
    this.deliveryForm.patchValue({ addressId: current.addressId ?? '', warehouseId: current.warehouseId ?? '', routeProvider: current.routeProvider ?? '', deliveryNotes: current.deliveryNotes });
    const draftId = this.route.snapshot.paramMap.get('draftId');
    if (draftId) this.draftApi.get(draftId).subscribe({ next: (draft) => { this.wizard.hydrate(draft); this.clientForm.patchValue({ clientAccountId: draft.clientAccountId, requestedDeliveryDate: draft.requestedDeliveryDate, priority: draft.priority, paymentOption: draft.paymentPreference, notes: draft.notes }); this.deliveryForm.patchValue({ addressId: draft.addressId ?? '', warehouseId: draft.warehouseId ?? '', routeProvider: draft.routeProvider ?? '', deliveryNotes: draft.deliveryNotes }); }, error: () => this.message.set('No se pudo recuperar el borrador de Sales. Retorna a Cliente.') });
  }

  title(): string { return `Manual Sales Order · ${this.step}`; }
  go(step: ManualOrderWizardStep): void { void this.router.navigateByUrl(this.wizard.path(step)); }
  saveClient(): void {
    if (this.clientForm.invalid) { this.clientForm.markAllAsTouched(); return; }
    const value = this.clientForm.getRawValue();
    this.saving.set(true); this.message.set(null);
    const save = (id: string, version: number) => this.draftApi.client(id, version, { clientAccountId: value.clientAccountId, requestedDeliveryDate: value.requestedDeliveryDate, priority: value.priority, paymentPreference: value.paymentOption, currency: this.state().currency, notes: value.notes });
    const currentId = this.state().draftId;
    if (currentId) save(currentId, this.state().version).subscribe({ next: (draft) => { this.wizard.hydrate(draft); this.saving.set(false); this.go('items'); }, error: () => { this.saving.set(false); this.message.set('No se pudo guardar Cliente.'); } });
    else this.draftApi.create().subscribe({ next: (draft) => { this.wizard.hydrate(draft); save(draft.id, draft.version).subscribe({ next: (updated) => { this.wizard.hydrate(updated); this.saving.set(false); this.go('items'); }, error: () => { this.saving.set(false); this.message.set('No se pudo guardar Cliente.'); } }); }, error: () => { this.saving.set(false); this.message.set('No se pudo crear el borrador de Sales.'); } });
  }
  addLine(): void { if (this.lineForm.invalid) { this.lineForm.markAllAsTouched(); return; } const value = this.lineForm.getRawValue(); this.wizard.updateLines([...this.state().lines, { catalogItemId: value.catalogItemId, quantity: value.quantity, unit: value.unit, notes: null }]); this.lineForm.reset({ catalogItemId: '', quantity: 1, unit: 'UNIT' }); }
  saveItems(): void { const id = this.state().draftId; if (!id) { this.message.set('Primero guarda Cliente.'); this.go('client'); return; } this.saving.set(true); this.draftApi.items(id, this.state().version, this.state().lines).subscribe({ next: (draft) => { this.wizard.hydrate(draft); this.saving.set(false); this.go('delivery'); }, error: () => { this.saving.set(false); this.message.set('No se pudieron guardar los ítems.'); } }); }
  saveDelivery(): void { if (this.deliveryForm.invalid) { this.deliveryForm.markAllAsTouched(); return; } const value = this.deliveryForm.getRawValue(); const id = this.state().draftId; if (!id) { this.message.set('Primero guarda Cliente.'); this.go('client'); return; } this.saving.set(true); this.draftApi.delivery(id, this.state().version, { addressId: value.addressId, deliveryNotes: value.deliveryNotes, routeProvider: value.routeProvider || null }).subscribe({ next: (draft) => { this.wizard.hydrate(draft); this.saving.set(false); this.go('review'); }, error: () => { this.saving.set(false); this.message.set('No se pudo guardar Entrega.'); } }); }
  selectedClientLabel(): string { const client = this.clients().find((item) => item.id === this.state().clientAccountId); return client ? `${client.commercialName} · ${client.code}` : this.state().clientAccountId || 'Pendiente'; }
  ready(): boolean { const current = this.state(); return Boolean(current.clientAccountId && current.requestedDeliveryDate && current.addressId && current.warehouseId && current.lines.length); }
  createOrder(): void { const id = this.state().draftId; if (!id || !this.ready()) return; this.saving.set(true); this.message.set(null); this.draftApi.submit(id, this.state().version).subscribe({ next: (order) => void this.router.navigate(['/ops/commercial/sales-orders', order.id]), error: () => { this.saving.set(false); this.message.set('No se pudo crear el Sales Order; el backend recargará el estado autoritativo.'); } }); }
}
