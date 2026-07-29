import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { PurchaseRequestOperationsFacade } from '../application/purchase-request-operations.facade';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
@Component({selector:'nexa-purchase-request-detail-page',imports:[MatButtonModule,MatCardModule,MatChipsModule,RouterLink,ErrorStateComponent,LoadingStateComponent,PageHeaderComponent],templateUrl:'./purchase-request-detail-page.component.html',styleUrl:'./purchase-request-detail-page.component.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class PurchaseRequestDetailPageComponent { readonly facade=inject(PurchaseRequestOperationsFacade); private readonly route=inject(ActivatedRoute); constructor(){const id=this.route.snapshot.paramMap.get('purchaseRequestId');if(id)this.facade.loadDetail(id);} review(action:'reviews'|'adjustment-requests'|'approvals'|'rejections'){const item=this.facade.state().item;if(item)this.facade.transition(item.id,item.version,action);} }
