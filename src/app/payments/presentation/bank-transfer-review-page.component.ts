import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { PaymentSummary } from '../domain/payment.models';
import { PaymentsApiService } from '../infrastructure/payments-api.service';

@Component({
  selector: 'nexa-bank-transfer-review-page',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe, PageHeaderComponent],
  template: `
    <section class="page">
      <nexa-page-header [eyebrow]="'payments.eyebrow' | translate" [title]="'payments.title' | translate" [subtitle]="'payments.subtitle' | translate" />
      <p class="hint">{{ 'payments.hint' | translate }}</p>
      @if (loading()) { <p role="status">{{ 'payments.states.loading' | translate }}</p> }
      @if (error(); as message) { <p class="error" role="alert">{{ message | translate }}</p> }
      @if (success(); as message) { <p class="success" role="status">{{ message | translate }}</p> }
      @if (!loading() && !error()) {
        <table>
          <thead><tr><th>{{ 'payments.fields.reference' | translate }}</th><th>{{ 'payments.fields.receivable' | translate }}</th><th>{{ 'payments.fields.clientAccount' | translate }}</th><th>{{ 'payments.fields.amount' | translate }}</th><th>{{ 'payments.fields.reported' | translate }}</th><th>{{ 'payments.fields.action' | translate }}</th></tr></thead>
          <tbody>
            @for (payment of payments(); track payment.id) {
              <tr>
                <td>{{ payment.reference || '—' }}</td>
                <td>{{ payment.receivableNumber }}<small>{{ payment.receivableId }}</small></td>
                <td>{{ payment.clientAccountId }}</td>
                <td>{{ payment.amount | number:'1.2-2' }} {{ payment.currency }}</td>
                <td>{{ payment.createdAt }}</td>
                <td class="actions">
                  <button type="button" [disabled]="busy()" (click)="approve(payment)">{{ busy() === payment.id + ':approve' ? ('payments.actions.approving' | translate) : ('payments.actions.approve' | translate) }}</button>
                  <button type="button" [disabled]="busy()" (click)="beginReject(payment)">{{ 'payments.actions.reject' | translate }}</button>
                  @if (rejectingId() === payment.id) {
                    <label [for]="'reject-reason-' + payment.id">{{ 'payments.fields.reason' | translate }}</label>
                    <input [id]="'reject-reason-' + payment.id" type="text" maxlength="1000" required [value]="rejectionReason()" (input)="rejectionReason.set($any($event.target).value)" />
                    <button type="button" [disabled]="busy() || !rejectionReason().trim()" (click)="reject(payment)">{{ busy() === payment.id + ':reject' ? ('payments.actions.rejecting' | translate) : ('payments.actions.confirmRejection' | translate) }}</button>
                  }
                </td>
              </tr>
            } @empty { <tr><td colspan="6">{{ 'payments.states.empty' | translate }}</td></tr> }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: [`:host{display:block}.page{display:grid;gap:1rem}.hint{margin:0;color:#52647b}.error{color:#a32020}.success{color:#0c6b41}table{width:100%;border-collapse:collapse}th,td{padding:.65rem;text-align:left;border-bottom:1px solid #dbe3ee;vertical-align:top}small{display:block;color:#64748b;font-size:.75rem;overflow-wrap:anywhere}.actions{display:flex;flex-wrap:wrap;gap:.35rem;align-items:center}.actions label{font-size:.8rem}.actions input{min-width:14rem;padding:.45rem;border:1px solid #9aaec4;border-radius:.35rem}button{padding:.45rem .7rem}.actions button{white-space:nowrap}@media(max-width:900px){table{display:block;overflow-x:auto;white-space:nowrap}.actions{white-space:normal}}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankTransferReviewPageComponent {
  private readonly api = inject(PaymentsApiService);
  readonly payments = signal<readonly PaymentSummary[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly rejectingId = signal<string | null>(null);
  readonly rejectionReason = signal('');
  readonly busy = signal<string | null>(null);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listPendingBankTransfers().subscribe({
      next: (page) => { this.payments.set(page.items); this.loading.set(false); },
      error: () => { this.error.set('payments.states.loadError'); this.loading.set(false); },
    });
  }

  approve(payment: PaymentSummary): void {
    if (this.busy()) return;
    this.startReview(payment, 'approve');
    this.api.approveBankTransfer(payment.id).subscribe({
      next: () => this.finishReview('payments.states.approved'),
      error: () => this.failReview('payments.states.approveError'),
    });
  }

  beginReject(payment: PaymentSummary): void {
    this.rejectingId.set(payment.id);
    this.rejectionReason.set('');
    this.error.set(null);
    this.success.set(null);
  }

  reject(payment: PaymentSummary): void {
    const reason = this.rejectionReason().trim();
    if (this.busy() || this.rejectingId() !== payment.id || !reason) return;
    this.startReview(payment, 'reject');
    this.api.rejectBankTransfer(payment.id, reason).subscribe({
      next: () => this.finishReview('payments.states.rejected'),
      error: () => this.failReview('payments.states.rejectError'),
    });
  }

  private startReview(payment: PaymentSummary, action: 'approve' | 'reject'): void {
    this.busy.set(`${payment.id}:${action}`);
    this.error.set(null);
    this.success.set(null);
  }

  private finishReview(message: string): void {
    this.busy.set(null);
    this.rejectingId.set(null);
    this.rejectionReason.set('');
    this.success.set(message);
    this.load();
  }

  private failReview(message: string): void {
    this.busy.set(null);
    this.error.set(message);
  }
}
