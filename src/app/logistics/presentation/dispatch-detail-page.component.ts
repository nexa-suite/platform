import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LogisticsFacade } from '../application/logistics.facade';
import { DispatchOrder } from '../domain/logistics.models';

@Component({
  selector: 'nexa-dispatch-detail-page',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page">
      <nexa-page-header title="Dispatch Detail" subtitle="Assignment, schedule, evidence and timeline" />
      @if (facade.loading()) { <nexa-loading-state /> }
      @else if (facade.error(); as error) { <nexa-error-state title="Dispatch unavailable" [description]="error" (retry)="retry()" /> }
      @else if (facade.selected(); as item) {
        <nexa-section-panel [title]="item.dispatchNumber">
          <dl><dt>Status</dt><dd>{{ item.status }}</dd><dt>Sales Order</dt><dd>{{ item.salesOrderNumber }}</dd><dt>Client Account</dt><dd>{{ item.clientAccountId }}</dd><dt>Destination</dt><dd>{{ item.destination || '—' }}</dd><dt>Temperature policy</dt><dd>{{ item.temperatureMin ?? '—' }} – {{ item.temperatureMax ?? '—' }} {{ item.temperatureUnit || '' }} ({{ item.temperatureStatus }})</dd><dt>POD</dt><dd>{{ item.podStatus || 'PENDING' }}</dd></dl>
          @if (item.status === 'PREPARING') {
            <form [formGroup]="assignment" (ngSubmit)="assign(item)"><h3>Assignment</h3><input formControlName="responsibleMembershipId" placeholder="Logistics membership"><input formControlName="vehicleReference" placeholder="Vehicle"><input formControlName="routeName" placeholder="Route"><button type="submit" [disabled]="assignment.invalid">Assign</button></form>
          }
          @if (item.status === 'ASSIGNED' || item.status === 'REPROGRAMMED') {
            <form [formGroup]="schedule" (ngSubmit)="scheduleDispatch(item)"><h3>Schedule</h3><input type="datetime-local" formControlName="deliveryWindowStart"><input type="datetime-local" formControlName="deliveryWindowEnd"><input type="datetime-local" formControlName="eta"><button type="submit" [disabled]="schedule.invalid">Schedule</button></form>
          }
          @if (item.status === 'SCHEDULED') { <button type="button" (click)="facade.ready(item)">Mark ready for route</button> }
          @if (item.status === 'READY_FOR_ROUTE') { <button type="button" (click)="facade.startRoute(item)">Start route</button> }
          @if (item.status === 'READY_FOR_ROUTE' || item.status === 'IN_ROUTE' || item.status === 'INCIDENT') {
            <form [formGroup]="temperature" (ngSubmit)="recordTemperature(item)"><h3>Temperature reading</h3><input type="number" step="0.1" formControlName="value" placeholder="Value"><select formControlName="unit"><option value="CELSIUS">Celsius</option><option value="FAHRENHEIT">Fahrenheit</option></select><input formControlName="source" placeholder="Source"><button type="submit" [disabled]="temperature.invalid">Record reading</button></form>
          }
          @if (item.status === 'IN_ROUTE') {
            <form [formGroup]="incident" (ngSubmit)="recordIncident(item)"><h3>Incident</h3><select formControlName="type"><option value="DELAY">Delay</option><option value="VEHICLE_ISSUE">Vehicle issue</option><option value="DELIVERY_REFUSED">Delivery refused</option><option value="ADDRESS_ISSUE">Address issue</option><option value="OTHER">Other</option></select><select formControlName="severity"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select><input formControlName="description" placeholder="Description"><label><input type="checkbox" formControlName="buyerVisible"> Buyer-visible review</label><button type="submit" [disabled]="incident.invalid">Record incident</button></form>
            <form [formGroup]="pod" (ngSubmit)="complete(item)"><h3>Proof of Delivery metadata</h3><input formControlName="receiverName" placeholder="Receiver name"><input type="datetime-local" formControlName="completedAt"><input formControlName="notes" placeholder="Notes"><label><input type="checkbox" formControlName="photoEvidenceDeclared"> Photo evidence declared</label><label><input type="checkbox" formControlName="signatureEvidenceDeclared"> Signature evidence declared</label><small>Metadata only. Secure file storage is pending TASK-NEXA-011.</small><button type="submit" [disabled]="pod.invalid">Complete delivery</button></form>
          }
          @if (item.status === 'INCIDENT') {
            <form [formGroup]="reprogram" (ngSubmit)="reprogramDispatch(item)"><h3>Reprogram route</h3><input type="datetime-local" formControlName="deliveryWindowStart"><input type="datetime-local" formControlName="deliveryWindowEnd"><input type="datetime-local" formControlName="eta"><input formControlName="reason" placeholder="Reason"><button type="submit" [disabled]="reprogram.invalid">Reprogram</button></form>
          }
        </nexa-section-panel>
        <nexa-section-panel title="Timeline"><ol>@for (event of facade.events(); track event.id) { <li>{{ event.type }} · {{ event.occurredAt }}<span>@if (event.summary) { · {{ event.summary }} }</span></li> } @empty { <li>No events yet.</li> }</ol></nexa-section-panel>
      }
    </section>
  `,
  styles: [`dl{display:grid;grid-template-columns:max-content 1fr;gap:.35rem 1rem}form{display:flex;gap:.5rem;flex-wrap:wrap;margin:1rem 0;padding:1rem;border:1px solid #ddd}input,select{padding:.55rem}button{margin:.25rem}small{width:100%}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchDetailPageComponent {
  readonly facade = inject(LogisticsFacade);
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('dispatchOrderId')!;
  private readonly fb = inject(FormBuilder);
  readonly assignment = this.fb.nonNullable.group({ responsibleMembershipId: ['', Validators.required], vehicleReference: [''], routeName: [''] });
  readonly schedule = this.fb.nonNullable.group({ deliveryWindowStart: ['', Validators.required], deliveryWindowEnd: ['', Validators.required], eta: [''] });
  readonly temperature = this.fb.nonNullable.group({ value: [0, Validators.required], unit: ['CELSIUS', Validators.required], source: ['MANUAL', Validators.required] });
  readonly incident = this.fb.nonNullable.group({ type: ['DELAY', Validators.required], severity: ['MEDIUM', Validators.required], description: ['', Validators.required], buyerVisible: [false] });
  readonly reprogram = this.fb.nonNullable.group({ deliveryWindowStart: ['', Validators.required], deliveryWindowEnd: ['', Validators.required], eta: [''], reason: ['', Validators.required] });
  readonly pod = this.fb.nonNullable.group({ receiverName: ['', Validators.required], completedAt: [this.localNow(), Validators.required], notes: [''], photoEvidenceDeclared: [false], signatureEvidenceDeclared: [false] });

  constructor() { this.facade.loadDetail(this.id); }
  retry(): void { this.facade.loadDetail(this.id); }
  assign(item: DispatchOrder): void { if (this.assignment.invalid) return; this.facade.assign(item, this.assignment.getRawValue()); }
  scheduleDispatch(item: DispatchOrder): void { if (this.schedule.invalid) return; const value = this.schedule.getRawValue(); this.facade.schedule(item, { deliveryWindowStart: this.instant(value.deliveryWindowStart), deliveryWindowEnd: this.instant(value.deliveryWindowEnd), eta: value.eta ? this.instant(value.eta) : undefined }); }
  recordTemperature(item: DispatchOrder): void { if (this.temperature.invalid) return; this.facade.temperature(item, this.temperature.getRawValue()); }
  recordIncident(item: DispatchOrder): void { if (this.incident.invalid) return; this.facade.incident(item, this.incident.getRawValue()); }
  reprogramDispatch(item: DispatchOrder): void { if (this.reprogram.invalid) return; const value = this.reprogram.getRawValue(); this.facade.reprogram(item, { deliveryWindowStart: this.instant(value.deliveryWindowStart), deliveryWindowEnd: this.instant(value.deliveryWindowEnd), eta: value.eta ? this.instant(value.eta) : undefined, reason: value.reason }); }
  complete(item: DispatchOrder): void { if (this.pod.invalid) return; const value = this.pod.getRawValue(); this.facade.complete(item, { receiverName: value.receiverName, completedAt: this.instant(value.completedAt), notes: value.notes || undefined, photoEvidenceDeclared: value.photoEvidenceDeclared, signatureEvidenceDeclared: value.signatureEvidenceDeclared }); }
  private instant(value: string): string { return new Date(value).toISOString(); }
  private localNow(): string { const value = new Date(); value.setMinutes(value.getMinutes() - value.getTimezoneOffset()); return value.toISOString().slice(0, 16); }
}
