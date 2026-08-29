import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent, type StatusTone } from '../../shared/presentation/components/status-badge/status-badge.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';
import { WarehouseSelectionService } from '../application/warehouse-selection.service';
import { WarehouseSummary } from '../domain/warehouse.models';

@Component({
  selector: 'nexa-warehouses-page',
  standalone: true,
  imports: [
    ErrorStateComponent,
    LoadingStateComponent,
    MetricCardComponent,
    NexaIconComponent,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink,
    SectionPanelComponent,
    StatusBadgeComponent,
    TranslatePipe,
  ],
  templateUrl: './warehouses-page.component.html',
  styleUrl: './warehouses-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarehousesPageComponent {
  readonly facade = inject(WarehouseOperationsFacade);
  private readonly selection = inject(WarehouseSelectionService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(32)]],
    name: ['', [Validators.required, Validators.maxLength(160)]],
    address: [''],
  });
  readonly editForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    address: [''],
    status: ['ACTIVE', Validators.required],
  });
  private readonly selectedId = signal<string | null>(null);
  readonly selected = computed(() => this.facade.warehouses().find((item) => item.id === this.selectedId()) ?? null);
  readonly selectedWarehouseId = this.selection.selectedId;
  readonly activeCount = computed(() => this.facade.warehouses().filter((item) => item.status === 'ACTIVE').length);
  readonly suspendedCount = computed(() => this.facade.warehouses().filter((item) => item.status === 'SUSPENDED').length);
  readonly configuredCount = computed(() => this.facade.warehouses().filter((item) => Boolean(item.address)).length);

  constructor() {
    this.facade.load();
  }

  create(): void {
    if (this.form.invalid) return;
    this.facade.createWarehouse(this.form.getRawValue());
    this.form.reset({ code: '', name: '', address: '' });
  }

  select(item: WarehouseSummary): void {
    this.selection.select(item.id);
    this.selectedId.set(item.id);
    this.editForm.reset({ name: item.name, address: item.address ?? '', status: item.status });
  }

  selectFromEvent(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    const item = this.facade.warehouses().find((candidate) => candidate.id === id);
    if (item) this.select(item);
    else {
      this.selection.clear();
      this.selectedId.set(null);
    }
  }

  update(item: WarehouseSummary): void {
    if (this.editForm.invalid) return;
    this.facade.updateWarehouse(item, this.editForm.getRawValue());
    this.clearSelection();
  }

  clearSelection(): void {
    this.selectedId.set(null);
  }

  statusTone(status: string): StatusTone {
    return status === 'ACTIVE' ? 'success' : 'warning';
  }
}
