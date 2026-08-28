import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../shared/presentation/components/button/button.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent, StatusTone } from '../../shared/presentation/components/status-badge/status-badge.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { downloadCsv, printCurrentView } from '../../shared/application/utilities/export.util';
import { LogisticsFacade } from '../application/logistics.facade';
import { DispatchAssignee, DispatchOrder } from '../domain/logistics.models';
import { formatDispatchDestination } from './dispatch-destination.util';

@Component({
  selector: 'nexa-dispatch-detail-page',
  standalone: true,
  imports: [DatePipe, RouterLink, ReactiveFormsModule, TranslatePipe, ButtonComponent, NexaIconComponent,
    PageHeaderComponent, SectionPanelComponent, StatusBadgeComponent, LoadingStateComponent, ErrorStateComponent],
  templateUrl: './dispatch-detail-page.component.html',
  styleUrl: './dispatch-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchDetailPageComponent {
  readonly facade = inject(LogisticsFacade);
  readonly canWrite = computed(() => this.facade.canWrite());
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('dispatchOrderId')!;
  private readonly fb = inject(FormBuilder);
  readonly assignment = this.fb.nonNullable.group({ responsibleMembershipId: ['', Validators.required], vehicleReference: [''], routeName: [''] });
  readonly assignees = signal<readonly DispatchAssignee[]>([]);
  readonly assigneeError = signal<string | null>(null);
  readonly schedule = this.fb.nonNullable.group({ deliveryWindowStart: ['', Validators.required], deliveryWindowEnd: ['', Validators.required], eta: [''] });
  readonly temperature = this.fb.nonNullable.group({ value: [0, Validators.required], unit: ['CELSIUS', Validators.required], source: ['MANUAL', Validators.required] });
  readonly incident = this.fb.nonNullable.group({ type: ['DELAY', Validators.required], severity: ['MEDIUM', Validators.required], description: ['', Validators.required], buyerVisible: [false] });
  readonly reprogram = this.fb.nonNullable.group({ deliveryWindowStart: ['', Validators.required], deliveryWindowEnd: ['', Validators.required], eta: [''], reason: ['', Validators.required] });
  readonly pod = this.fb.nonNullable.group({ receiverName: ['', Validators.required], completedAt: [this.localNow(), Validators.required], notes: [''], photoEvidenceDeclared: [false], signatureEvidenceDeclared: [false] });
  readonly handoff = this.fb.nonNullable.group({ note: ['', [Validators.required, Validators.maxLength(2000)]] });

  constructor() {
    this.facade.loadDetail(this.id);
    this.facade.assignees().subscribe({ next: (value) => this.assignees.set(value), error: () => this.assigneeError.set('No se pudo cargar el roster de operadores logísticos.') });
    effect(() => {
      const assignment = this.facade.selected()?.assignment;
      if (assignment) this.assignment.patchValue({ responsibleMembershipId: assignment.responsibleMembershipId ?? '', vehicleReference: assignment.vehicleReference ?? '', routeName: assignment.routeName ?? '' }, { emitEvent: false });
    });
  }

  retry(): void { this.facade.loadDetail(this.id); }
  assign(item: DispatchOrder): void { if (this.assignment.invalid) return; this.facade.assign(item, this.assignment.getRawValue()); }
  scheduleDispatch(item: DispatchOrder): void { if (this.schedule.invalid) return; const value = this.schedule.getRawValue(); this.facade.schedule(item, { deliveryWindowStart: this.instant(value.deliveryWindowStart), deliveryWindowEnd: this.instant(value.deliveryWindowEnd), eta: value.eta ? this.instant(value.eta) : undefined }); }
  recordTemperature(item: DispatchOrder): void { if (this.temperature.invalid) return; this.facade.temperature(item, this.temperature.getRawValue()); }
  recordIncident(item: DispatchOrder): void { if (this.incident.invalid) return; this.facade.incident(item, this.incident.getRawValue()); }
  reprogramDispatch(item: DispatchOrder): void { if (this.reprogram.invalid) return; const value = this.reprogram.getRawValue(); this.facade.reprogram(item, { deliveryWindowStart: this.instant(value.deliveryWindowStart), deliveryWindowEnd: this.instant(value.deliveryWindowEnd), eta: value.eta ? this.instant(value.eta) : undefined, reason: value.reason }); }
  complete(item: DispatchOrder): void { if (this.pod.invalid) return; const value = this.pod.getRawValue(); this.facade.complete(item, { receiverName: value.receiverName, completedAt: this.instant(value.completedAt), notes: value.notes || undefined, photoEvidenceDeclared: value.photoEvidenceDeclared, signatureEvidenceDeclared: value.signatureEvidenceDeclared }); }
  appendHandoff(item: DispatchOrder): void { if (this.handoff.invalid) return; this.facade.appendHandoff(item, this.handoff.controls.note.value); this.handoff.reset(); }
  hasAssignee(id: string): boolean { return this.assignees().some((assignee) => assignee.id === id); }
  destinationLabel(item: DispatchOrder): string { return formatDispatchDestination(item); }
  statusTone(status: string): StatusTone { if (status === 'DELIVERED') return 'success'; if (status === 'INCIDENT' || status === 'CANCELLED') return 'danger'; if (status === 'IN_ROUTE') return 'info'; if (status === 'READY_FOR_ROUTE' || status === 'SCHEDULED') return 'accent'; return 'neutral'; }
  temperatureTone(status: string): StatusTone { if (status === 'OUT_OF_RANGE' || status === 'TEMPERATURE_ALERT') return 'danger'; if (status === 'WITHIN_RANGE') return 'success'; return 'neutral'; }
  exportCsv(): void { const item = this.facade.selected(); if (item) downloadCsv(`nexa-${item.dispatchNumber}.csv`, [{ dispatch: item.dispatchNumber, salesOrder: item.salesOrderNumber, status: item.status, destination: item.destination ?? '', pod: item.podStatus ?? '' }]); }
  print(): void { printCurrentView(); }
  private instant(value: string): string { return new Date(value).toISOString(); }
  private localNow(): string { const value = new Date(); value.setMinutes(value.getMinutes() - value.getTimezoneOffset()); return value.toISOString().slice(0, 16); }
}
