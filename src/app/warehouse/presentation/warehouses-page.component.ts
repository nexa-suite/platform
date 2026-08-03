import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { TranslatePipe } from '@ngx-translate/core';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';
import { WarehouseSelectionService } from '../application/warehouse-selection.service';
import { WarehouseSummary } from '../domain/warehouse.models';

@Component({
  selector: 'nexa-warehouses-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page">
      <nexa-page-header [title]="'warehouse.managementTitle' | translate" [subtitle]="'warehouse.managementDescription' | translate" />
      @if (facade.loading()) { <nexa-loading-state /> }
      @else if (facade.error(); as error) { <nexa-error-state title="Warehouses unavailable" [description]="error" (retry)="facade.retry()" /> }
      @else {
        @if (!facade.canWrite()) { <p class="read-only" role="status">{{ 'warehouse.readOnly' | translate }}</p> }
        <nexa-section-panel [title]="'warehouse.selectionTitle' | translate" [description]="'warehouse.selectionDescription' | translate">
          <label>{{ 'warehouse.currentWarehouse' | translate }} <select [value]="selectedWarehouseId() ?? ''" (change)="selectFromEvent($event)"><option value="">{{ 'warehouse.selectWarehouse' | translate }}</option>@for (item of facade.warehouses(); track item.id) { <option [value]="item.id">{{ item.code }} · {{ item.name }}</option> }</select></label>
        </nexa-section-panel>
        @if (facade.canWrite()) { <nexa-section-panel [title]="'warehouse.createWarehouse' | translate">
          <form [formGroup]="form" (ngSubmit)="create()"><input formControlName="code" [placeholder]="'warehouse.fields.code' | translate" [attr.aria-label]="'warehouse.fields.code' | translate"><input formControlName="name" [placeholder]="'warehouse.fields.name' | translate" [attr.aria-label]="'warehouse.fields.name' | translate"><input formControlName="address" [placeholder]="'warehouse.fields.address' | translate" [attr.aria-label]="'warehouse.fields.address' | translate"><button type="submit" [disabled]="form.invalid">{{ 'warehouse.actions.create' | translate }}</button></form>
        </nexa-section-panel> }
        @if (selected(); as item) {
          @if (facade.canWrite()) { <nexa-section-panel [title]="('warehouse.updateWarehouse' | translate) + ' ' + item.code">
            <form [formGroup]="editForm" (ngSubmit)="update(item)"><input formControlName="name" [placeholder]="'warehouse.fields.name' | translate" [attr.aria-label]="'warehouse.fields.name' | translate"><input formControlName="address" [placeholder]="'warehouse.fields.address' | translate" [attr.aria-label]="'warehouse.fields.address' | translate"><select formControlName="status" [attr.aria-label]="'warehouse.fields.status' | translate"><option value="ACTIVE">{{ 'warehouse.status.ACTIVE' | translate }}</option><option value="SUSPENDED">{{ 'warehouse.status.SUSPENDED' | translate }}</option></select><button type="submit" [disabled]="editForm.invalid">{{ 'warehouse.actions.save' | translate }}</button><button type="button" (click)="clearSelection()">{{ 'warehouse.actions.cancel' | translate }}</button></form>
          </nexa-section-panel> }
        }
        <nexa-section-panel [title]="'warehouse.warehouses' | translate">
          <table><thead><tr><th>{{ 'warehouse.fields.code' | translate }}</th><th>{{ 'warehouse.fields.name' | translate }}</th><th>{{ 'warehouse.fields.status' | translate }}</th><th>{{ 'warehouse.fields.actions' | translate }}</th></tr></thead><tbody>
            @for (item of facade.warehouses(); track item.id) { <tr><td><a [routerLink]="['/ops/operations/warehouses', item.id]">{{ item.code }}</a></td><td>{{ item.name }}</td><td>{{ ('warehouse.status.' + item.status) | translate }}</td><td>@if (facade.canWrite()) { <button type="button" (click)="select(item)">{{ 'warehouse.actions.update' | translate }}</button><button type="button" (click)="facade.suspendWarehouse(item)" [disabled]="item.status !== 'ACTIVE'">{{ 'warehouse.actions.suspend' | translate }}</button> } @else { <span>{{ 'warehouse.readOnly' | translate }}</span> }</td></tr> }
            @empty { <tr><td colspan="4">{{ 'warehouse.empty' | translate }}</td></tr> }
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
  private readonly selection = inject(WarehouseSelectionService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({ code: ['', [Validators.required, Validators.maxLength(32)]], name: ['', [Validators.required, Validators.maxLength(160)]], address: [''] });
  readonly editForm = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.maxLength(160)]], address: [''], status: ['ACTIVE', Validators.required] });
  private readonly selectedId = signal<string | null>(null);
  readonly selected = computed(() => this.facade.warehouses().find((item) => item.id === this.selectedId()) ?? null);
  readonly selectedWarehouseId = this.selection.selectedId;

  constructor() { this.facade.load(); }
  create(): void { if (this.form.invalid) return; this.facade.createWarehouse(this.form.getRawValue()); this.form.reset(); }
  select(item: WarehouseSummary): void { this.selection.select(item.id); this.selectedId.set(item.id); this.editForm.reset({ name: item.name, address: item.address ?? '', status: item.status }); }
  selectFromEvent(event: Event): void { const id = (event.target as HTMLSelectElement).value; const item = this.facade.warehouses().find((candidate) => candidate.id === id); if (item) this.select(item); else this.selection.clear(); }
  update(item: WarehouseSummary): void { if (this.editForm.invalid) return; this.facade.updateWarehouse(item, this.editForm.getRawValue()); this.clearSelection(); }
  clearSelection(): void { this.selectedId.set(null); }
}
