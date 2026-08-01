import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationService } from '../../../iam/application/authentication.service';
import { ChangeFeedService } from '../../../core/change-feed/infrastructure/change-feed.service';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { PurchaseRequestOperationsFacade } from '../application/purchase-request-operations.facade';
import { PurchaseRequestAction } from '../domain/purchase-request.models';

@Component({ selector: 'nexa-purchase-request-detail-page', imports: [MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, RouterLink, TranslatePipe, ErrorStateComponent, LoadingStateComponent, PageHeaderComponent], templateUrl: './purchase-request-detail-page.component.html', styleUrl: './purchase-request-detail-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class PurchaseRequestDetailPageComponent {
  readonly facade = inject(PurchaseRequestOperationsFacade);
  readonly note = new FormControl('', { nonNullable: true });
  private readonly authentication = inject(AuthenticationService);
  readonly canConvert = computed(() => this.authentication.hasPermission('sales:write'));
  private readonly feed = inject(ChangeFeedService);
  private readonly id: string | null;

  constructor() { this.id = inject(ActivatedRoute).snapshot.paramMap.get('purchaseRequestId'); this.feed.connect(); if (this.id) this.facade.loadDetail(this.id); }
  review(action: PurchaseRequestAction): void { const item = this.facade.state().item; if (item) this.facade.transition(item.id, item.version, action, this.note.value); }
  convert(): void { const item = this.facade.state().item; if (item) this.facade.convertToOrder(item.id, item.version, this.note.value); }
  retry(): void { this.facade.retry(); }
}
