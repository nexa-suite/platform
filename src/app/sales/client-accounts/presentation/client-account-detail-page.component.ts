import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { ClientAccountsFacade } from '../application/client-accounts.facade';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
@Component({ selector:'nexa-client-account-detail-page', imports:[MatButtonModule,MatCardModule,MatChipsModule,RouterLink,ErrorStateComponent,LoadingStateComponent,PageHeaderComponent], templateUrl:'./client-account-detail-page.component.html', styleUrl:'./client-account-detail-page.component.scss', changeDetection:ChangeDetectionStrategy.OnPush })
export class ClientAccountDetailPageComponent { readonly facade=inject(ClientAccountsFacade); private readonly route=inject(ActivatedRoute); constructor(){const id=this.route.snapshot.paramMap.get('clientAccountId');if(id)this.facade.loadDetail(id);} }
