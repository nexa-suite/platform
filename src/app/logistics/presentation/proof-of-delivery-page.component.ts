import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LogisticsFacade } from '../application/logistics.facade';

@Component({selector:'nexa-proof-of-delivery-page',standalone:true,imports:[DatePipe,PageHeaderComponent,SectionPanelComponent],template:`<section class="page"><nexa-page-header title="Proof of Delivery" subtitle="Metadata only; secure file storage belongs to TASK-NEXA-011"/><nexa-section-panel title="POD records"><table><thead><tr><th>Dispatch</th><th>Status</th><th>Receiver</th><th>Completed</th><th>Evidence declarations</th></tr></thead><tbody>@for(item of facade.proof();track item.dispatchOrderId){<tr><td>{{item.dispatchNumber}}</td><td>{{item.status}}</td><td>{{item.receiverName}}</td><td>{{item.completedAt|date:'short'}}</td><td>Photo: {{item.photoEvidenceDeclared?'declared':'not declared'}} · Signature: {{item.signatureEvidenceDeclared?'declared':'not declared'}}</td></tr>}</tbody></table></nexa-section-panel></section>`,styles:[`table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #ddd}`],changeDetection:ChangeDetectionStrategy.OnPush})
export class ProofOfDeliveryPageComponent{readonly facade=inject(LogisticsFacade);constructor(){this.facade.loadProof();}}
