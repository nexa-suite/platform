import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { WarehouseOperationsFacade } from '../application/warehouse-operations.facade';

@Component({selector:'nexa-stock-movements-page',standalone:true,imports:[DatePipe,PageHeaderComponent,SectionPanelComponent],template:`<section class="page"><nexa-page-header title="Stock Movements" subtitle="Append-only ledger from inbound, adjustment, waste and reservation commands" /><nexa-section-panel title="Ledger"><table><thead><tr><th>Type</th><th>Lot</th><th>Quantity</th><th>Before / after</th><th>Occurred</th></tr></thead><tbody>@for(movement of facade.movements();track movement.id){<tr><td>{{movement.type}}</td><td>{{movement.lotId}}</td><td>{{movement.quantity}} {{movement.unit}}</td><td>{{movement.quantityBefore}} → {{movement.quantityAfter}}</td><td>{{movement.occurredAt|date:'short'}}</td></tr>}</tbody></table></nexa-section-panel></section>`,styles:[`table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #ddd}`],changeDetection:ChangeDetectionStrategy.OnPush})
export class StockMovementsPageComponent {readonly facade=inject(WarehouseOperationsFacade);constructor(){this.facade.load();}}
