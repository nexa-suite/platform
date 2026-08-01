import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';

@Component({selector:'nexa-inventory-lots-page',standalone:true,imports:[DatePipe,RouterLink,PageHeaderComponent,SectionPanelComponent],template:`<section class="page"><nexa-page-header title="Inventory Lots" subtitle="FEFO order and lot status are authoritative server state" /><nexa-section-panel title="Lots"><table><thead><tr><th>Catalog</th><th>Batch</th><th>Expiration</th><th>Available</th><th>Status</th></tr></thead><tbody>@for(lot of facade.lots();track lot.id){<tr><td><a [routerLink]="['/ops/operations/inventory/lots',lot.id]">{{lot.catalogItemId}}</a></td><td>{{lot.batchNumber}}</td><td>{{lot.expirationDate|date:'mediumDate'}}</td><td>{{lot.available}} {{lot.unit}}</td><td>{{lot.status}}</td></tr>}</tbody></table></nexa-section-panel></section>`,styles:[`table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #ddd}`],changeDetection:ChangeDetectionStrategy.OnPush})
export class InventoryLotsPageComponent {readonly facade=inject(WarehouseOperationsFacade);constructor(){this.facade.load();}}
