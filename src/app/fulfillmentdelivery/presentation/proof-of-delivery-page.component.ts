import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonComponent } from '../../shared/presentation/components/button/button.component';
import { EmptyStateComponent } from '../../shared/presentation/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { MetricCardComponent } from '../../shared/presentation/components/metric-card/metric-card.component';
import { NexaIconComponent } from '../../shared/presentation/components/nexa-icon/nexa-icon.component';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { StatusBadgeComponent } from '../../shared/presentation/components/status-badge/status-badge.component';
import { LogisticsFacade } from '../application/logistics.facade';
import { ProofOfDelivery } from '../domain/logistics.models';

@Component({
  selector: 'nexa-proof-of-delivery-page',
  standalone: true,
  imports: [DatePipe, RouterLink, ReactiveFormsModule, TranslatePipe, ButtonComponent, EmptyStateComponent,
    ErrorStateComponent, LoadingStateComponent, MetricCardComponent, NexaIconComponent, PageHeaderComponent,
    SectionPanelComponent, StatusBadgeComponent],
  templateUrl: './proof-of-delivery-page.component.html',
  styleUrl: './proof-of-delivery-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProofOfDeliveryPageComponent {
  readonly facade = inject(LogisticsFacade);
  private readonly fb = inject(FormBuilder);
  readonly selected = signal<ProofOfDelivery | null>(null);
  readonly form = this.fb.nonNullable.group({ receiverName: ['', Validators.required], completedAt: [this.localNow(), Validators.required], notes: [''], photoEvidenceDeclared: [false], signatureEvidenceDeclared: [false] });

  constructor() {
    this.facade.loadProof();
    effect(() => {
      const pending = this.facade.pendingProof();
      const current = this.selected();
      if (current && pending.some((item) => item.dispatchOrderId === current.dispatchOrderId)) return;
      this.selected.set(pending[0] ?? null);
    });
  }

  select(item: ProofOfDelivery): void {
    this.selected.set(item);
    this.form.reset({ receiverName: '', completedAt: this.localNow(), notes: '', photoEvidenceDeclared: false, signatureEvidenceDeclared: false });
  }

  complete(item: ProofOfDelivery): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.facade.completePending(item, { ...value, completedAt: new Date(value.completedAt).toISOString(), notes: value.notes || undefined });
  }

  private localNow(): string {
    const value = new Date();
    value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
    return value.toISOString().slice(0, 16);
  }
}
