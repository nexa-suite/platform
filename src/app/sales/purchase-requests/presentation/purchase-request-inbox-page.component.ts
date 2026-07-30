import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { PurchaseRequestOperationsFacade } from '../application/purchase-request-operations.facade';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/presentation/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
@Component({selector:'nexa-purchase-request-inbox-page',imports:[MatButtonModule,MatCardModule,MatChipsModule,MatSelectModule,RouterLink,ErrorStateComponent,LoadingStateComponent,EmptyStateComponent,PageHeaderComponent],templateUrl:'./purchase-request-inbox-page.component.html',styleUrl:'./purchase-request-inbox-page.component.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class PurchaseRequestInboxPageComponent { readonly facade=inject(PurchaseRequestOperationsFacade); constructor(){this.facade.load();} filter(status:string){this.facade.load(status?{status}:{});} }
