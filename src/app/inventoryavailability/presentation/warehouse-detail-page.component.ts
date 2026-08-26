import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';
import { StorageZone } from '../domain/warehouse.models';

@Component({
  selector: 'nexa-warehouse-detail-page',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page">
      <nexa-page-header title="Warehouse Detail" subtitle="Zones remain scoped to the selected warehouse" />
      @if (facade.loading()) { <nexa-loading-state /> }
      @else if (facade.error(); as error) { <nexa-error-state title="Warehouse zones unavailable" [description]="error" (retry)="facade.loadZones(warehouseId)" /> }
      @else {
        <nexa-section-panel title="Create zone">
          <form [formGroup]="form" (ngSubmit)="createZone()"><input formControlName="code" placeholder="Code"><input formControlName="name" placeholder="Name"><select formControlName="type"><option value="AMBIENT">Ambient</option><option value="CHILLED">Chilled</option><option value="FROZEN">Frozen</option><option value="QUARANTINE">Quarantine</option></select><input type="number" formControlName="temperatureMin" placeholder="Min °C"><input type="number" formControlName="temperatureMax" placeholder="Max °C"><button type="submit" [disabled]="form.invalid || !facade.canWrite()">Create</button></form>
        </nexa-section-panel>
        @if (selected(); as zone) {
          <nexa-section-panel [title]="'Update ' + zone.code">
            <form [formGroup]="editForm" (ngSubmit)="updateZone(zone)"><input formControlName="name" placeholder="Name"><input type="number" formControlName="temperatureMin" placeholder="Min °C"><input type="number" formControlName="temperatureMax" placeholder="Max °C"><select formControlName="status"><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option></select><button type="submit" [disabled]="editForm.invalid || !facade.canWrite()">Save update</button><button type="button" (click)="clearSelection()">Cancel</button></form>
          </nexa-section-panel>
        }
        <nexa-section-panel title="Zones">
          <table><thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Temperature</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            @for (zone of facade.zones(); track zone.id) { <tr><td>{{ zone.code }}</td><td>{{ zone.name }}</td><td>{{ zone.type }}</td><td>{{ zone.temperatureMin ?? '—' }} – {{ zone.temperatureMax ?? '—' }}</td><td>{{ zone.status }}</td><td><button type="button" (click)="select(zone)" [disabled]="!facade.canWrite()">Update</button><button type="button" (click)="facade.updateZone(warehouseId, zone, { status: 'SUSPENDED' })" [disabled]="!facade.canWrite() || zone.status !== 'ACTIVE'">Suspend</button></td></tr> }
            @empty { <tr><td colspan="6">No zones found.</td></tr> }
          </tbody></table>
        </nexa-section-panel>
      }
    </section>
  `,
  styles: [`form{display:flex;gap:.5rem;flex-wrap:wrap}input,select{padding:.55rem}table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #ddd}button{margin-right:.4rem}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarehouseDetailPageComponent {
  readonly facade = inject(WarehouseOperationsFacade);
  readonly warehouseId = inject(ActivatedRoute).snapshot.paramMap.get('warehouseId')!;
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({ code: ['', Validators.required], name: ['', Validators.required], type: ['AMBIENT', Validators.required], temperatureMin: [null as number | null], temperatureMax: [null as number | null] });
  readonly editForm = this.fb.nonNullable.group({ name: ['', Validators.required], temperatureMin: [null as number | null], temperatureMax: [null as number | null], status: ['ACTIVE', Validators.required] });
  private readonly selectedId = signal<string | null>(null);
  readonly selected = computed(() => this.facade.zones().find((item) => item.id === this.selectedId()) ?? null);

  constructor() { this.facade.loadZones(this.warehouseId); }
  createZone(): void { if (this.form.invalid) return; const value = this.form.getRawValue(); this.facade.createZone(this.warehouseId, { code: value.code, name: value.name, type: value.type, temperatureMin: value.temperatureMin ?? undefined, temperatureMax: value.temperatureMax ?? undefined }); this.form.reset({ code: '', name: '', type: 'AMBIENT', temperatureMin: null, temperatureMax: null }); }
  select(zone: StorageZone): void { this.selectedId.set(zone.id); this.editForm.reset({ name: zone.name, temperatureMin: zone.temperatureMin ?? null, temperatureMax: zone.temperatureMax ?? null, status: zone.status }); }
  updateZone(zone: StorageZone): void { if (this.editForm.invalid) return; const value = this.editForm.getRawValue(); this.facade.updateZone(this.warehouseId, zone, { name: value.name, temperatureMin: value.temperatureMin ?? undefined, temperatureMax: value.temperatureMax ?? undefined, status: value.status }); this.clearSelection(); }
  clearSelection(): void { this.selectedId.set(null); }
}
