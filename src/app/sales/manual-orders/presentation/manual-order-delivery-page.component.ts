import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { ManualOrderWizardFacade } from '../application/manual-order-wizard.facade';
import { ManualOrderRoutePreviewComponent } from './manual-order-route-preview.component';

@Component({
  selector: 'nexa-manual-order-delivery-page',
  standalone: true,
  imports: [ManualOrderRoutePreviewComponent, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, PageHeaderComponent, ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <a mat-button [routerLink]="itemsPath()">← Ítems</a>
      <nexa-page-header eyebrow="VENTAS · PASO 3/4" title="Entrega y servicio" subtitle="La dirección se valida y el servidor selecciona almacén y ruta." />
      <nav class="steps" aria-label="Pasos de orden manual"><a [routerLink]="clientPath()">Cliente</a><a [routerLink]="itemsPath()">Ítems</a><a class="active">Entrega</a><a [routerLink]="reviewPath()">Revisión</a></nav>
      <mat-card>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
            <mat-form-field appearance="outline" class="wide"><mat-label>Dirección guardada</mat-label><mat-select formControlName="addressId"><mat-option value="">Crear dirección estructurada</mat-option>@for (address of facade.state().addresses; track address.id) { <mat-option [value]="address.id" [disabled]="!address.active">{{ address.label }} · {{ address.line }}</mat-option> }</mat-select></mat-form-field>
            @if (!form.controls.addressId.value) {
              <mat-form-field appearance="outline"><mat-label>Tipo de vía</mat-label><input matInput formControlName="addressType" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Destinatario</mat-label><input matInput formControlName="recipientName" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Teléfono</mat-label><input matInput formControlName="recipientPhone" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Nombre de vía</mat-label><input matInput formControlName="streetName" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Número</mat-label><input matInput formControlName="streetNumber" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Interior / local</mat-label><input matInput formControlName="interior" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Línea complementaria</mat-label><input matInput formControlName="addressLine" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Referencia</mat-label><input matInput formControlName="reference" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Departamento</mat-label><input matInput formControlName="departmentCode" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Provincia</mat-label><input matInput formControlName="provinceCode" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Distrito</mat-label><input matInput formControlName="districtCode" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Código postal</mat-label><input matInput formControlName="postalCode" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Latitud</mat-label><input matInput type="number" formControlName="latitude" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Longitud</mat-label><input matInput type="number" formControlName="longitude" /></mat-form-field>
              <mat-form-field appearance="outline" class="wide"><mat-label>Instrucciones de recepción</mat-label><textarea matInput rows="2" formControlName="receivingInstructions"></textarea></mat-form-field>
              <mat-form-field appearance="outline" class="wide"><mat-label>Horario de recepción</mat-label><input matInput formControlName="receivingHours" /></mat-form-field>
            }
            <mat-form-field appearance="outline"><mat-label>Proveedor de ruta</mat-label><input matInput formControlName="routeProvider" /></mat-form-field>
            <mat-form-field appearance="outline" class="wide"><mat-label>Instrucciones de entrega</mat-label><textarea matInput rows="3" formControlName="deliveryNotes"></textarea></mat-form-field>
          </form>
          <p class="server-note">Al guardar, el servidor calcula la disponibilidad de todas las líneas, selecciona un almacén operativo y genera el snapshot de ruta.</p>
          @if (facade.state().draft?.delivery; as delivery) {
            <nexa-manual-order-route-preview [routeSnapshot]="delivery.routeSnapshot" [warehouseSnapshot]="delivery.warehouseSnapshot" [addressSnapshot]="delivery.addressSnapshot" [routeProvider]="delivery.routeProvider" />
          }
          @if (facade.state().message; as message) { <p role="alert">{{ message }}</p> }
        </mat-card-content>
        <mat-card-actions><button mat-flat-button color="primary" type="button" [disabled]="saving()" (click)="save()">{{ saving() ? 'Validando…' : 'Guardar y continuar' }}</button></mat-card-actions>
      </mat-card>
    </section>
  `,
  styleUrl: './manual-order-wizard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualOrderDeliveryPageComponent {
  readonly facade = inject(ManualOrderWizardFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly draftId = this.route.snapshot.paramMap.get('draftId') ?? '';
  readonly saving = signal(false);
  private loadedClientId: string | null = null;
  readonly form = this.fb.nonNullable.group({
    addressId: [''], addressType: ['STREET'], recipientName: [''], recipientPhone: [''], streetName: [''], streetNumber: [''], interior: [''], addressLine: [''], reference: [''],
    departmentCode: [''], provinceCode: [''], districtCode: [''], postalCode: [''], latitude: [-12.0464], longitude: [-77.0428],
    receivingInstructions: [''], receivingHours: [''], routeProvider: ['LOCAL_ESTIMATE'], deliveryNotes: ['']
  });

  constructor() {
    if (this.draftId) this.facade.loadDraft(this.draftId);
    effect(() => {
      const clientId = this.facade.state().draft?.client?.id ?? null;
      if (clientId && clientId !== this.loadedClientId) { this.loadedClientId = clientId; this.facade.loadAddresses(clientId); }
      const delivery = this.facade.state().draft?.delivery;
      if (delivery) this.form.patchValue({ addressId: delivery.addressId ?? '', routeProvider: delivery.routeProvider ?? 'LOCAL_ESTIMATE', deliveryNotes: delivery.deliveryNotes ?? '' }, { emitEvent: false });
    });
  }

  clientPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/client`; }
  itemsPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/items`; }
  reviewPath(): string { return `/ops/commercial/manual-orders/${this.draftId}/review`; }

  save(): void {
    const draft = this.facade.state().draft;
    const value = this.form.getRawValue();
    if (!draft?.client?.id || !this.draftId) return;
    if (!value.addressId && (!value.streetName.trim() || !value.streetNumber.trim() || !value.departmentCode.trim() || !value.provinceCode.trim() || !value.districtCode.trim())) {
      this.form.controls.streetName.markAsTouched();
      return;
    }
    this.saving.set(true);
    const address$ = value.addressId ? undefined : this.facade.createAddress(draft.client.id, {
        label: [value.streetName, value.streetNumber, value.interior].filter((part) => part.trim()).join(' '),
        address: {
        addressType: value.addressType.trim() || 'STREET', line: [value.streetName, value.streetNumber, value.interior, value.addressLine].filter((part) => part.trim()).join(' '), reference: value.reference.trim(), countryCode: 'PE',
        departmentCode: value.departmentCode.trim(), provinceCode: value.provinceCode.trim(), districtCode: value.districtCode.trim(),
        recipientName: value.recipientName.trim() || null, recipientPhone: value.recipientPhone.trim() || null, roadType: value.addressType.trim() || null,
        streetName: value.streetName.trim() || null, streetNumber: value.streetNumber.trim() || null, interior: value.interior.trim() || null,
        postalCode: value.postalCode.trim() || null, receivingInstructions: value.receivingInstructions.trim() || null,
        receivingHours: value.receivingHours.trim() || null, latitude: value.latitude, longitude: value.longitude, source: 'MANUAL'
      }
    });
    const save = (addressId: string) => this.facade.saveDelivery(this.draftId, { addressId, routeProvider: value.routeProvider.trim() || null, deliveryNotes: value.deliveryNotes.trim() || null });
    const operation = address$ ? address$.pipe(switchMap((address) => save(address.id))) : save(value.addressId);
    operation.subscribe({
      next: () => void this.router.navigate(['/ops/commercial/manual-orders', this.draftId, 'review']),
      error: () => this.saving.set(false)
    });
  }
}
