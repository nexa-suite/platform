import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PlatformAuthenticationBoundary } from '../../../core/security/platform-authentication.boundary';
import { ChangeFeedService } from '../../../core/change-feed/application/change-feed.service';
import { ButtonComponent } from '../../../shared/presentation/components/button/button.component';
import { EmptyStateComponent } from '../../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { NexaIconComponent } from '../../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent, StatusTone } from '../../../shared/presentation/components/status-badge/status-badge.component';
import { PurchaseRequestOperationsFacade } from '../../application/purchase-requests/purchase-request-operations.facade';
import { PurchaseRequestAction, PurchaseRequestPriority, PurchaseRequestStatus } from '../../domain/purchase-requests/purchase-request.models';

@Component({ selector: 'nexa-purchase-request-detail-page', imports: [ReactiveFormsModule, RouterLink, TranslatePipe, ButtonComponent, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent, NexaIconComponent, PageHeaderComponent, SectionPanelComponent, StatusBadgeComponent], templateUrl: './purchase-request-detail-page.component.html', styleUrl: './purchase-request-detail-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class PurchaseRequestDetailPageComponent {
  readonly facade = inject(PurchaseRequestOperationsFacade);
  readonly note = new FormControl('', { nonNullable: true });
  private readonly authentication = inject(PlatformAuthenticationBoundary);
  readonly canWrite = computed(() => this.authentication.hasPermission('sales:write'));
  readonly canConvert = computed(() => this.authentication.hasPermission('sales:write'));
  private readonly feed = inject(ChangeFeedService);
  private readonly id: string | null;

  constructor() { this.id = inject(ActivatedRoute).snapshot.paramMap.get('purchaseRequestId'); this.feed.connect(); if (this.id) this.facade.loadDetail(this.id); }
  review(action: PurchaseRequestAction): void { const item = this.facade.state().item; if (this.canWrite() && item) this.facade.transition(item.id, item.version, action, this.note.value); }
  convert(): void { const item = this.facade.state().item; if (this.canWrite() && item) this.facade.convertToOrder(item.id, item.version, this.note.value); }
  retry(): void { this.facade.retry(); }
  statusTone(status: PurchaseRequestStatus): StatusTone {
    if (status === 'APPROVED' || status === 'CONVERTED_TO_ORDER') return 'success';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'danger';
    if (status === 'IN_REVIEW' || status === 'NEEDS_ADJUSTMENT') return 'warning';
    return 'info';
  }
  priorityTone(priority: PurchaseRequestPriority): StatusTone { return priority === 'URGENT' ? 'danger' : priority === 'HIGH' ? 'warning' : 'neutral'; }
}
