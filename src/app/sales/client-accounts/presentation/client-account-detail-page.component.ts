import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ChangeFeedService } from '../../../core/change-feed/infrastructure/change-feed.service';
import { ErrorStateComponent } from '../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/presentation/components/page-header/page-header.component';
import { ClientAccountsFacade } from '../application/client-accounts.facade';
import { ClientAccountCommand } from '../domain/client-account.models';

@Component({ selector: 'nexa-client-account-detail-page', imports: [MatButtonModule, MatCardModule, MatChipsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, RouterLink, TranslatePipe, ErrorStateComponent, LoadingStateComponent, PageHeaderComponent], templateUrl: './client-account-detail-page.component.html', styleUrl: './client-account-detail-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class ClientAccountDetailPageComponent {
  readonly facade = inject(ClientAccountsFacade);
  readonly form = new FormGroup({ businessName: new FormControl('', { nonNullable: true, validators: [Validators.required] }), commercialName: new FormControl('', { nonNullable: true, validators: [Validators.required] }), segment: new FormControl('', { nonNullable: true }), contactPerson: new FormControl('', { nonNullable: true }), contactEmail: new FormControl('', { nonNullable: true, validators: [Validators.email] }), phone: new FormControl('', { nonNullable: true }), deliveryProfile: new FormControl('', { nonNullable: true }), paymentCondition: new FormControl('', { nonNullable: true }), buyerMembershipId: new FormControl('', { nonNullable: true }) });
  private readonly feed = inject(ChangeFeedService);
  private readonly id: string | null;
  readonly isCreate: boolean;

  private seededAccountId: string | null = null;

  constructor() {
    this.id = inject(ActivatedRoute).snapshot.paramMap.get('clientAccountId');
    this.isCreate = this.id === null;
    this.feed.connect();
    effect(() => {
      const account = this.facade.state().item;
      if (!account || account.id === this.seededAccountId) return;
      this.seededAccountId = account.id;
      this.form.reset({ ...account, buyerMembershipId: account.buyerMembershipId ?? '' });
    });
    if (this.id) this.facade.loadDetail(this.id);
  }

  save(): void {
    const account = this.facade.state().item;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { buyerMembershipId: _buyerMembershipId, ...command } = this.form.getRawValue();
    if (account) this.facade.update(account.id, account.version, command satisfies ClientAccountCommand);
    else this.facade.create(command satisfies ClientAccountCommand);
  }
  activate(): void { const account = this.facade.state().item; if (account) this.facade.changeStatus(account.id, account.version, 'activations'); }
  suspend(): void { const account = this.facade.state().item; if (account) this.facade.changeStatus(account.id, account.version, 'suspensions'); }
  associateBuyer(): void { const account = this.facade.state().item; if (account) this.facade.associateBuyer(account.id, account.version, this.form.controls.buyerMembershipId.value.trim() || null); }
  retry(): void { this.facade.retry(); }
}
