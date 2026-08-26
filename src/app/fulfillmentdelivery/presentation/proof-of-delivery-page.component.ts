import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LogisticsFacade } from '../application/logistics.facade';
import { ProofOfDelivery } from '../domain/logistics.models';

@Component({
  selector: 'nexa-proof-of-delivery-page', standalone: true,
  imports: [DatePipe, RouterLink, ReactiveFormsModule, TranslatePipe, PageHeaderComponent, SectionPanelComponent, LoadingStateComponent, ErrorStateComponent],
  template: `<section class="page"><nexa-page-header [title]="'logistics.pod' | translate" [subtitle]="'logistics.states.metadataOnly' | translate" />
    @if (facade.loading()) { <nexa-loading-state /> }
    @else if (facade.error(); as error) { <nexa-error-state [title]="'logistics.unavailable' | translate" [description]="error" (retry)="facade.loadProof()" /> }
    @else {
      <nexa-section-panel [title]="'logistics.states.pending' | translate"><table><thead><tr><th>{{ 'logistics.fields.dispatch' | translate }}</th><th>{{ 'logistics.fields.status' | translate }}</th><th>{{ 'logistics.fields.action' | translate }}</th></tr></thead><tbody>
        @for(item of facade.pendingProof();track item.dispatchOrderId){<tr><td>{{item.dispatchNumber}}</td><td>{{ ('logistics.status.' + item.status) | translate }}</td><td><a [routerLink]="['/ops/operations/dispatch-orders',item.dispatchOrderId]">{{ 'logistics.actions.complete' | translate }}</a></td></tr>} @empty {<tr><td colspan="3">{{ 'logistics.empty' | translate }}</td></tr>}
      </tbody></table></nexa-section-panel>
      @if (selected(); as item) { <nexa-section-panel [title]="'logistics.forms.podMetadata' | translate"><form [formGroup]="form" (ngSubmit)="complete(item)"><label>{{ 'logistics.forms.receiver' | translate }}<input formControlName="receiverName"></label><input type="datetime-local" formControlName="completedAt"><label>{{ 'logistics.forms.notes' | translate }}<input formControlName="notes"></label><label><input type="checkbox" formControlName="photoEvidenceDeclared">{{ 'logistics.forms.photo' | translate }}</label><label><input type="checkbox" formControlName="signatureEvidenceDeclared">{{ 'logistics.forms.signature' | translate }}</label><button type="submit" [disabled]="form.invalid || !facade.canWrite()">{{ 'logistics.forms.completeDelivery' | translate }}</button></form></nexa-section-panel> }
      <nexa-section-panel [title]="'logistics.fields.completed' | translate"><table><thead><tr><th>{{ 'logistics.fields.dispatch' | translate }}</th><th>{{ 'logistics.fields.receiver' | translate }}</th><th>{{ 'logistics.fields.completed' | translate }}</th><th>{{ 'logistics.fields.evidence' | translate }}</th></tr></thead><tbody>@for(item of facade.completedProof();track item.dispatchOrderId){<tr><td>{{item.dispatchNumber}}</td><td>{{item.receiverName || '—'}}</td><td>{{item.completedAt|date:'short'}}</td><td>{{item.photoEvidenceDeclared ? ('logistics.states.photoDeclared'|translate) : ('logistics.states.photoNotDeclared'|translate)}} · {{item.signatureEvidenceDeclared ? ('logistics.states.signatureDeclared'|translate) : ('logistics.states.signatureNotDeclared'|translate)}}</td></tr>} @empty {<tr><td colspan="4">{{ 'logistics.empty' | translate }}</td></tr>}</tbody></table></nexa-section-panel>
    }</section>`,
  styles: [`table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #ddd}form{display:flex;gap:.75rem;flex-wrap:wrap}input{padding:.5rem}`], changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProofOfDeliveryPageComponent {
  readonly facade = inject(LogisticsFacade); private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({receiverName:['',Validators.required],completedAt:[this.localNow(),Validators.required],notes:[''],photoEvidenceDeclared:[false],signatureEvidenceDeclared:[false]});
  readonly selected = () => this.facade.pendingProof()[0] ?? null;
  constructor(){this.facade.loadProof();}
  complete(item: ProofOfDelivery): void { if(this.form.invalid)return; const value=this.form.getRawValue(); this.facade.completePending(item,{...value,completedAt:new Date(value.completedAt).toISOString(),notes:value.notes||undefined}); }
  private localNow(): string { const value=new Date(); value.setMinutes(value.getMinutes()-value.getTimezoneOffset()); return value.toISOString().slice(0,16); }
}
