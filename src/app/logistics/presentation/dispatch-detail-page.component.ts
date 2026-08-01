import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
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
  imports: [ReactiveFormsModule, TranslatePipe, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <section class="page">
      <nexa-page-header [title]="'logistics.detail' | translate" [subtitle]="'logistics.detailSubtitle' | translate" />
      @if (facade.loading()) { <nexa-loading-state /> }
      @else if (facade.error(); as error) { <nexa-error-state [title]="'logistics.unavailable' | translate" [description]="error" (retry)="retry()" /> }
      @else if (facade.selected(); as item) {
        <nexa-section-panel [title]="item.dispatchNumber">
          <dl><dt>{{ 'logistics.fields.status' | translate }}</dt><dd>{{ ('logistics.status.' + item.status) | translate }}</dd><dt>{{ 'logistics.fields.salesOrder' | translate }}</dt><dd>{{ item.salesOrderNumber }}</dd><dt>{{ 'logistics.fields.client' | translate }}</dt><dd>{{ item.clientAccountId || '—' }}</dd><dt>{{ 'logistics.fields.destination' | translate }}</dt><dd>{{ item.destination || '—' }}</dd><dt>{{ 'logistics.fields.temperature' | translate }}</dt><dd>{{ item.temperatureMin ?? '—' }} – {{ item.temperatureMax ?? '—' }} {{ item.temperatureUnit || '' }} ({{ ('logistics.status.' + item.temperatureStatus) | translate }})</dd><dt>{{ 'logistics.fields.pod' | translate }}</dt><dd>{{ item.podStatus || ('logistics.states.pending' | translate) }}</dd></dl>
          @if (item.status === 'PREPARING') {
            <form [formGroup]="assignment" (ngSubmit)="assign(item)"><h3>{{ 'logistics.forms.assignment' | translate }}</h3><label>{{ 'logistics.forms.membership' | translate }}<input formControlName="responsibleMembershipId"></label><label>{{ 'logistics.forms.vehicle' | translate }}<input formControlName="vehicleReference"></label><label>{{ 'logistics.forms.route' | translate }}<input formControlName="routeName"></label><button type="submit" [disabled]="assignment.invalid">{{ 'logistics.forms.assign' | translate }}</button></form>
          }
          @if (item.status === 'ASSIGNED' || item.status === 'REPROGRAMMED') {
            <form [formGroup]="schedule" (ngSubmit)="scheduleDispatch(item)"><h3>{{ 'logistics.forms.schedule' | translate }}</h3><input type="datetime-local" formControlName="deliveryWindowStart"><input type="datetime-local" formControlName="deliveryWindowEnd"><input type="datetime-local" formControlName="eta"><button type="submit" [disabled]="schedule.invalid">{{ 'logistics.forms.schedule' | translate }}</button></form>
          }
          @if (item.status === 'SCHEDULED') { <button type="button" (click)="facade.ready(item)">{{ 'logistics.actions.ready' | translate }}</button> }
          @if (item.status === 'READY_FOR_ROUTE') { <button type="button" (click)="facade.startRoute(item)">{{ 'logistics.actions.startRoute' | translate }}</button> }
          @if (item.status === 'READY_FOR_ROUTE' || item.status === 'IN_ROUTE' || item.status === 'INCIDENT') {
            <form [formGroup]="temperature" (ngSubmit)="recordTemperature(item)"><h3>{{ 'logistics.forms.reading' | translate }}</h3><label>{{ 'logistics.forms.value' | translate }}<input type="number" step="0.1" formControlName="value"></label><select formControlName="unit"><option value="CELSIUS">{{ 'logistics.forms.celsius' | translate }}</option><option value="FAHRENHEIT">{{ 'logistics.forms.fahrenheit' | translate }}</option></select><label>{{ 'logistics.forms.source' | translate }}<input formControlName="source"></label><button type="submit" [disabled]="temperature.invalid">{{ 'logistics.actions.record' | translate }}</button></form>
          }
          @if (item.status === 'IN_ROUTE') {
            <form [formGroup]="incident" (ngSubmit)="recordIncident(item)"><h3>{{ 'logistics.forms.incident' | translate }}</h3><select formControlName="type"><option value="DELAY">{{ 'logistics.forms.delay' | translate }}</option><option value="VEHICLE_ISSUE">{{ 'logistics.forms.vehicleIssue' | translate }}</option><option value="DELIVERY_REFUSED">{{ 'logistics.forms.deliveryRefused' | translate }}</option><option value="ADDRESS_ISSUE">{{ 'logistics.forms.addressIssue' | translate }}</option><option value="OTHER">{{ 'logistics.forms.other' | translate }}</option></select><select formControlName="severity"><option value="LOW">{{ 'logistics.forms.low' | translate }}</option><option value="MEDIUM">{{ 'logistics.forms.medium' | translate }}</option><option value="HIGH">{{ 'logistics.forms.high' | translate }}</option><option value="CRITICAL">{{ 'logistics.forms.critical' | translate }}</option></select><label>{{ 'logistics.forms.description' | translate }}<input formControlName="description"></label><label><input type="checkbox" formControlName="buyerVisible"> {{ 'logistics.forms.buyerVisible' | translate }}</label><button type="submit" [disabled]="incident.invalid">{{ 'logistics.forms.recordIncident' | translate }}</button></form>
            <form [formGroup]="pod" (ngSubmit)="complete(item)"><h3>{{ 'logistics.forms.podMetadata' | translate }}</h3><label>{{ 'logistics.forms.receiver' | translate }}<input formControlName="receiverName"></label><input type="datetime-local" formControlName="completedAt"><label>{{ 'logistics.forms.notes' | translate }}<input formControlName="notes"></label><label><input type="checkbox" formControlName="photoEvidenceDeclared"> {{ 'logistics.forms.photo' | translate }}</label><label><input type="checkbox" formControlName="signatureEvidenceDeclared"> {{ 'logistics.forms.signature' | translate }}</label><small>{{ 'logistics.states.metadataOnly' | translate }}</small><button type="submit" [disabled]="pod.invalid">{{ 'logistics.forms.completeDelivery' | translate }}</button></form>
          }
          @if (item.status === 'INCIDENT') {
            <form [formGroup]="reprogram" (ngSubmit)="reprogramDispatch(item)"><h3>{{ 'logistics.forms.reprogramRoute' | translate }}</h3><input type="datetime-local" formControlName="deliveryWindowStart"><input type="datetime-local" formControlName="deliveryWindowEnd"><input type="datetime-local" formControlName="eta"><label>{{ 'logistics.forms.reason' | translate }}<input formControlName="reason"></label><button type="submit" [disabled]="reprogram.invalid">{{ 'logistics.actions.reprogram' | translate }}</button></form>
          }
        </nexa-section-panel>
        <nexa-section-panel [title]="'logistics.fields.timeline' | translate"><ol>@for (event of facade.events(); track event.id) { <li>{{ ('logistics.status.' + (event.toStatus || 'UNKNOWN')) | translate }} · {{ event.occurredAt }}<span>@if (event.summary) { · {{ ('logistics.status.' + event.summary) | translate }} }</span></li> } @empty { <li>{{ 'logistics.states.noEvents' | translate }}</li> }</ol></nexa-section-panel>
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
