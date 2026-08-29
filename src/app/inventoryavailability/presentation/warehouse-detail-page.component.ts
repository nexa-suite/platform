import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent, type StatusTone } from '../../shared/presentation/components/status-badge/status-badge.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';
import { StorageZone } from '../domain/warehouse.models';

@Component({
  selector: 'nexa-warehouse-detail-page',
  standalone: true,
  imports: [
    EmptyStateComponent,
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
  templateUrl: './warehouse-detail-page.component.html',
  styleUrl: './warehouse-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarehouseDetailPageComponent {
  readonly facade = inject(WarehouseOperationsFacade);
  readonly warehouseId = inject(ActivatedRoute).snapshot.paramMap.get('warehouseId')!;
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(32)]],
    name: ['', [Validators.required, Validators.maxLength(160)]],
    type: ['AMBIENT', Validators.required],
    temperatureMin: [null as number | null],
    temperatureMax: [null as number | null],
  });
  readonly editForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    temperatureMin: [null as number | null],
    temperatureMax: [null as number | null],
    status: ['ACTIVE', Validators.required],
  });
  readonly zoneTypes = ['AMBIENT', 'CHILLED', 'FROZEN', 'QUARANTINE'] as const;
  private readonly selectedId = signal<string | null>(null);
  readonly selected = computed(() => this.facade.zones().find((item) => item.id === this.selectedId()) ?? null);
  readonly activeCount = computed(() => this.facade.zones().filter((zone) => zone.status === 'ACTIVE').length);
  readonly temperatureControlledCount = computed(() => this.facade.zones().filter((zone) => ['CHILLED', 'FROZEN'].includes(zone.type)).length);

  constructor() {
    this.facade.loadZones(this.warehouseId);
  }

  createZone(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.facade.createZone(this.warehouseId, {
      code: value.code,
      name: value.name,
      type: value.type,
      temperatureMin: value.temperatureMin ?? undefined,
      temperatureMax: value.temperatureMax ?? undefined,
    });
    this.form.reset({ code: '', name: '', type: 'AMBIENT', temperatureMin: null, temperatureMax: null });
  }

  select(zone: StorageZone): void {
    this.selectedId.set(zone.id);
    this.editForm.reset({
      name: zone.name,
      temperatureMin: zone.temperatureMin ?? null,
      temperatureMax: zone.temperatureMax ?? null,
      status: zone.status,
    });
  }

  updateZone(zone: StorageZone): void {
    if (this.editForm.invalid) return;
    const value = this.editForm.getRawValue();
    this.facade.updateZone(this.warehouseId, zone, {
      name: value.name,
      temperatureMin: value.temperatureMin ?? undefined,
      temperatureMax: value.temperatureMax ?? undefined,
      status: value.status,
    });
    this.clearSelection();
  }

  clearSelection(): void {
    this.selectedId.set(null);
  }

  statusTone(status: string): StatusTone {
    return status === 'ACTIVE' ? 'success' : 'warning';
  }
}
