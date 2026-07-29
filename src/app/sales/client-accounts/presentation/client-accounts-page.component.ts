import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { ClientAccountsFacade } from '../application/client-accounts.facade';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/presentation/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';

@Component({ selector: 'nexa-client-accounts-page', imports: [MatButtonModule,MatCardModule,MatChipsModule,MatFormFieldModule,MatInputModule,RouterLink,ErrorStateComponent,LoadingStateComponent,EmptyStateComponent,PageHeaderComponent], templateUrl: './client-accounts-page.component.html', styleUrl: './client-accounts-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class ClientAccountsPageComponent { readonly facade=inject(ClientAccountsFacade); constructor(){this.facade.load();} searchAccounts(value:string){this.facade.load(value);} }
