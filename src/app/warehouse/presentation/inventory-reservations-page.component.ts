import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';

@Component({selector:'nexa-inventory-reservations-page',standalone:true,imports:[DatePipe,RouterLink,PageHeaderComponent,SectionPanelComponent],template:`<section class="page"><nexa-page-header title="Inventory Reservations" subtitle="Reservation lifecycle and safe release" /><nexa-section-panel title="Reservations"><table><thead><tr><th>Order</th><th>Status</th><th>Expires</th><th></th></tr></thead><tbody>@for(item of facade.reservations();track item.id){<tr><td><a [routerLink]="['/ops/operations/inventory/reservations',item.id]">{{item.orderNumber}}</a></td><td>{{item.status}}</td><td>{{item.expiresAt|date:'short'}}</td><td><button type="button" (click)="facade.release(item.id,item.version,'Warehouse release')" [disabled]="!facade.canWrite() || item.status !== 'RESERVED'">Release</button></td></tr>}</tbody></table></nexa-section-panel></section>`,styles:[`table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #ddd}`],changeDetection:ChangeDetectionStrategy.OnPush})
export class InventoryReservationsPageComponent {readonly facade=inject(WarehouseOperationsFacade);constructor(){this.facade.load();}}
