import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';

@Component({selector:'nexa-fulfillment-readiness-page',standalone:true,imports:[DatePipe,PageHeaderComponent,SectionPanelComponent,LoadingStateComponent,ErrorStateComponent],template:`<section class="page"><nexa-page-header title="Fulfillment Readiness" subtitle="Reserved orders ready for dispatch" />@if(facade.loading()){<nexa-loading-state/>}@else if(facade.error();as error){<nexa-error-state title="Readiness unavailable" [description]="error" (retry)="facade.loadReadiness()"/>}@else{<nexa-section-panel title="Ready reservations"><table><thead><tr><th>Order</th><th>Lines</th><th>Reserved quantity</th><th>Expires</th></tr></thead><tbody>@for(item of facade.readiness();track item.reservationId){<tr><td>{{item.orderNumber}}</td><td>{{item.lineCount}}</td><td>{{item.totalReservedQuantity}}</td><td>{{item.expiresAt|date:'short'}}</td></tr>}</tbody></table></nexa-section-panel>}</section>`,styles:[`table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #ddd}`],changeDetection:ChangeDetectionStrategy.OnPush})
export class FulfillmentReadinessPageComponent {readonly facade=inject(WarehouseOperationsFacade);constructor(){this.facade.loadReadiness();}}
