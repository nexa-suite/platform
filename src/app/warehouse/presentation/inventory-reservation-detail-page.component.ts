import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';

@Component({selector:'nexa-inventory-reservation-detail-page',standalone:true,imports:[DatePipe,PageHeaderComponent,SectionPanelComponent],template:`<section class="page"><nexa-page-header title="Reservation Detail" subtitle="Reservation status and expiry are server authoritative" />@if(item();as reservation){<nexa-section-panel title="Reservation"><p>Order: {{reservation.orderNumber}}</p><p>Status: {{reservation.status}}</p><p>Expires: {{reservation.expiresAt|date:'medium'}}</p><button type="button" (click)="facade.release(reservation.id,reservation.version,'Warehouse release')" [disabled]="reservation.status !== 'RESERVED'">Release reservation</button></nexa-section-panel>}@else{<p>Reservation not found in the current page.</p>}</section>`,changeDetection:ChangeDetectionStrategy.OnPush})
export class InventoryReservationDetailPageComponent {readonly facade=inject(WarehouseOperationsFacade);readonly id=inject(ActivatedRoute).snapshot.paramMap.get('reservationId')!;readonly item=computed(()=>this.facade.reservations().find(value=>value.id===this.id));constructor(){this.facade.load();}}
