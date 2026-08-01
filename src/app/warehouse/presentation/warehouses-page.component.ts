import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';
import { WarehouseSummary } from '../domain/warehouse.models';

@Component({
  selector: 'nexa-warehouses-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page">
      <nexa-page-header title="Warehouses and Zones" subtitle="Scoped warehouse mutations use the server version returned by the API" />
      @if (facade.loading()) { <nexa-loading-state /> }
      @else if (facade.error(); as error) { <nexa-error-state title="Warehouses unavailable" [description]="error" (retry)="facade.retry()" /> }
      @else {
        <nexa-section-panel title="Create warehouse">
          <form [formGroup]="form" (ngSubmit)="create()"><input formControlName="code" placeholder="Code" aria-label="Warehouse code"><input formControlName="name" placeholder="Name" aria-label="Warehouse name"><input formControlName="address" placeholder="Address" aria-label="Warehouse address"><button type="submit" [disabled]="form.invalid">Create</button></form>
        </nexa-section-panel>
        @if (selected(); as item) {
          <nexa-section-panel [title]="'Update ' + item.code">
            <form [formGroup]="editForm" (ngSubmit)="update(item)"><input formControlName="name" placeholder="Name" aria-label="Updated warehouse name"><input formControlName="address" placeholder="Address" aria-label="Updated warehouse address"><select formControlName="status" aria-label="Warehouse status"><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option></select><button type="submit" [disabled]="editForm.invalid">Save update</button><button type="button" (click)="clearSelection()">Cancel</button></form>
          </nexa-section-panel>
        }
        <nexa-section-panel title="Warehouses">
          <table><thead><tr><th>Code</th><th>Name</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            @for (item of facade.warehouses(); track item.id) { <tr><td><a [routerLink]="['/ops/operations/warehouses', item.id]">{{ item.code }}</a></td><td>{{ item.name }}</td><td>{{ item.status }}</td><td><button type="button" (click)="select(item)">Update</button><button type="button" (click)="facade.suspendWarehouse(item)" [disabled]="item.status !== 'ACTIVE'">Suspend</button></td></tr> }
            @empty { <tr><td colspan="4">No warehouses found.</td></tr> }
          </tbody></table>
        </nexa-section-panel>
      }
    </section>
  `,
  styles: [`form{display:flex;gap:.5rem;flex-wrap:wrap}input,select{padding:.55rem}table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #ddd}button{margin-right:.4rem}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarehousesPageComponent {
  readonly facade = inject(WarehouseOperationsFacade);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({ code: ['', [Validators.required, Validators.maxLength(32)]], name: ['', [Validators.required, Validators.maxLength(160)]], address: [''] });
  readonly editForm = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.maxLength(160)]], address: [''], status: ['ACTIVE', Validators.required] });
  private readonly selectedId = signal<string | null>(null);
  readonly selected = computed(() => this.facade.warehouses().find((item) => item.id === this.selectedId()) ?? null);

  constructor() { this.facade.load(); }
  create(): void { if (this.form.invalid) return; this.facade.createWarehouse(this.form.getRawValue()); this.form.reset(); }
  select(item: WarehouseSummary): void { this.selectedId.set(item.id); this.editForm.reset({ name: item.name, address: item.address ?? '', status: item.status }); }
  update(item: WarehouseSummary): void { if (this.editForm.invalid) return; this.facade.updateWarehouse(item, this.editForm.getRawValue()); this.clearSelection(); }
  clearSelection(): void { this.selectedId.set(null); }
}
