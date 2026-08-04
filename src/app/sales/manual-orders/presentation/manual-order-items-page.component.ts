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
import { ProductCatalogItem } from '../../../catalog-management/domain/models/catalog.models';
import { ManualOrderWizardFacade } from '../application/manual-order-wizard.facade';
import { ManualOrderLineCommand } from '../domain/manual-order.models';

@Component({
  selector: 'nexa-manual-order-items-page',
  standalone: true,
  imports: [DecimalPipe, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, PageHeaderComponent, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <a mat-button [routerLink]="clientPath()">← Cliente</a>
      <nexa-page-header eyebrow="VENTAS · PASO 2/4" title="Ítems y cantidades" subtitle="El servidor devuelve precio y disponibilidad autoritativos." />
      <nav class="steps" aria-label="Pasos de orden manual"><a [routerLink]="clientPath()">Cliente</a><a class="active">Ítems</a><a [routerLink]="deliveryPath()">Entrega</a><a [routerLink]="reviewPath()">Revisión</a></nav>
      <mat-card>
        <mat-card-content>
          <div class="search"><mat-form-field appearance="outline"><mat-label>Buscar catálogo</mat-label><input matInput #query (keyup.enter)="search(query.value)" /></mat-form-field><button mat-stroked-button type="button" (click)="search(query.value)">Buscar</button></div>
          <form [formGroup]="form" (ngSubmit)="addLine()" class="line-form">
            <mat-form-field appearance="outline"><mat-label>SKU / catálogo</mat-label><mat-select formControlName="catalogItemId"><mat-option value="">Seleccionar ítem</mat-option>@for (item of facade.state().catalogItems; track item.id) { <mat-option [value]="item.id">{{ item.productFamilyName }} · {{ item.skuCode || item.name }} · {{ item.presentation }}</mat-option> }</mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Cantidad</mat-label><input matInput type="number" min="0.01" step="0.01" formControlName="quantity" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Unidad</mat-label><input matInput formControlName="unit" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Nota de línea</mat-label><input matInput formControlName="notes" /></mat-form-field>
            <button mat-stroked-button type="submit">Agregar</button>
          </form>
          @if (selectedCatalogItem(); as item) {
            <div class="catalog-preview">
              @if (item.image.url; as imageUrl) { <img [src]="imageUrl" [alt]="item.productFamilyName" /> } @else { <span class="image-placeholder" aria-hidden="true">SKU</span> }
              <div>
                <strong>{{ item.productFamilyName }}</strong>
                <span>{{ item.brand }} · {{ item.category }}</span>
                <span>SKU {{ item.skuCode || 'No informado' }} · {{ item.presentation }}</span>
                <span>U/M {{ item.unitOfMeasure || 'No informada' }} · {{ item.packagingType || 'Empaque no informado' }}</span>
                <span>Peso neto {{ item.netWeight ?? '—' }} · bruto {{ item.grossWeight ?? '—' }}</span>
                <span>Precio base {{ item.unitPrice.amount | number:'1.2-2' }} {{ item.unitPrice.currency }} · disponibilidad {{ item.availabilityStatus }}</span>
              </div>
            </div>
          }
          <div class="lines">
            @for (line of lines(); track $index) { <div class="line"><span><strong>{{ itemName(line.catalogItemId) }}</strong> · {{ line.quantity }} {{ line.unit }}</span><button mat-button type="button" (click)="removeLine($index)">Quitar</button></div> }
            @if (!lines().length) { <p>No hay ítems agregados.</p> }
          </div>
          @if (serverLines().length) {
            <h3>Resultado del servidor</h3>
            @for (line of serverLines(); track line.id) { <div class="server-line"><span><strong>{{ line.productFamily }}</strong> · {{ line.familyCode }} · SKU {{ line.skuCode }} · {{ line.presentation }} · {{ line.quantity }} {{ line.unit }}</span><span>Base {{ line.baseUnitPrice | number:'1.2-2' }} · efectivo {{ line.effectiveUnitPrice | number:'1.2-2' }} · descuento {{ line.discountAmount | number:'1.2-2' }} {{ line.currency }} · {{ line.availabilityStatus }}</span></div> }
          }
          @if (facade.state().message; as message) { <p role="alert">{{ message }}</p> }
        </mat-card-content>
        <mat-card-actions><button mat-flat-button color="primary" type="button" [disabled]="saving() || !lines().length" (click)="save()">{{ saving() ? 'Validando…' : 'Guardar y continuar' }}</button></mat-card-actions>
      </mat-card>
    </section>
  `,
  styles: [`.page{display:grid;gap:16px;max-width:1100px;margin:auto;padding:32px}.steps{display:flex;gap:8px}.steps a{padding:8px 12px;border:1px solid #dbe3ee;border-radius:6px;text-decoration:none}.steps .active{background:#ecfdf5;border-color:#0f766e}.search,.line-form{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.catalog-preview{display:flex;gap:16px;align-items:center;padding:16px;margin-top:12px;background:#f8fafc;border-radius:8px}.catalog-preview img,.image-placeholder{width:72px;height:72px;object-fit:cover;border-radius:8px;background:#e2e8f0}.image-placeholder{display:grid;place-items:center;color:#475569;font-size:12px}.catalog-preview div{display:grid;gap:4px}.catalog-preview span{color:#475569}.lines{display:grid;gap:8px;margin-top:16px}.line,.server-line{display:flex;justify-content:space-between;gap:12px;padding:12px;border-bottom:1px solid #e2e8f0}.server-line{color:#334155}.mat-mdc-card-actions{justify-content:flex-end;padding:16px}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualOrderItemsPageComponent {
  readonly facade = inject(ManualOrderWizardFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly draftId = this.route.snapshot.paramMap.get('draftId') ?? '';
  readonly saving = signal(false);
  readonly lines = signal<readonly ManualOrderLineCommand[]>([]);
  readonly form = this.fb.nonNullable.group({
    catalogItemId: ['', Validators.required], quantity: [1, [Validators.required, Validators.min(0.01)]], unit: ['UNIT', Validators.required], notes: ['']
  });

  constructor() {
    this.facade.loadReferences();
    if (this.draftId) this.facade.loadDraft(this.draftId);
    effect(() => {
      const draft = this.facade.state().draft;
      if (draft?.id === this.draftId && draft.lines.length) this.lines.set(draft.lines.map((line) => ({ skuId: line.skuId, catalogItemId: line.catalogItemId, quantity: line.quantity, unit: line.unit, notes: line.notes })));
    });
  }

  clientPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/client`; }
  deliveryPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/delivery`; }
  reviewPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/review`; }
  serverLines() { return this.facade.state().draft?.lines ?? []; }
  selectedCatalogItem(): ProductCatalogItem | null {
    const id = this.form.controls.catalogItemId.value;
    return this.facade.state().catalogItems.find((item) => item.id === id) ?? null;
  }
  itemName(id: string | null | undefined): string { return this.facade.state().catalogItems.find((item) => item.id === id)?.name ?? id ?? 'Ítem'; }
  search(query: string): void { this.facade.searchCatalog(query); }

  addLine(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    const next = this.lines().filter((line) => line.catalogItemId !== value.catalogItemId);
    next.push({ catalogItemId: value.catalogItemId, quantity: value.quantity, unit: value.unit, notes: value.notes || null });
    this.lines.set(next);
    this.form.reset({ catalogItemId: '', quantity: 1, unit: 'UNIT', notes: '' });
  }

  removeLine(index: number): void { this.lines.update((items) => items.filter((_, position) => position !== index)); }

  save(): void {
    if (!this.draftId || !this.lines().length) return;
    this.saving.set(true);
    this.facade.saveItems(this.draftId, this.lines()).subscribe({
      next: () => void this.router.navigate(['/ops/commercial/manual-orders', this.draftId, 'delivery']),
      error: () => this.saving.set(false)
    });
  }
}
