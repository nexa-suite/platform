import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { PaymentPage, PaymentReviewResult, PaymentSummary } from '../../domain/payment.models';
import { PaymentsApiPort } from '../../domain/ports/payments-api.port';
import { MOCK_PAYMENT_FIXTURES } from './mock-payments.fixtures';

const DEMO_NOW = '2026-08-26T10:00:00Z';

/** BC-08 in-memory adapter for bank-transfer review. */
@Injectable({ providedIn: 'root' })
export class MockPaymentsApiService extends PaymentsApiPort {
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private readonly payments = new Map(MOCK_PAYMENT_FIXTURES[this.config.tenantProfile].map((item) => [item.id, item]));

  listPendingBankTransfers(page = 0, size = 25): Observable<PaymentPage> {
    const items = [...this.payments.values()].filter((item) => item.method === 'BANK_TRANSFER' && item.status === 'PROCESSING');
    return of({ items: items.slice(page * size, page * size + size), page, size, total: items.length });
  }

  approveBankTransfer(paymentId: string): Observable<PaymentReviewResult> { return this.review(paymentId, 'APPROVED', null); }

  rejectBankTransfer(paymentId: string, reason: string): Observable<PaymentReviewResult> { return this.review(paymentId, 'REJECTED', reason.trim() || 'Rejected by operator.'); }

  private review(paymentId: string, status: string, reason: string | null): Observable<PaymentReviewResult> {
    const current = this.payments.get(paymentId);
    if (!current) return throwError(() => new Error('MOCK_PAYMENT_NOT_FOUND'));
    if (current.status !== 'PROCESSING') return throwError(() => new Error('MOCK_PAYMENT_ALREADY_REVIEWED'));
    const updated: PaymentSummary = { ...current, status, reviewReason: reason, completedAt: DEMO_NOW };
    this.payments.set(paymentId, updated);
    return of({ id: updated.id, receivableId: updated.receivableId, method: updated.method, status: updated.status, amount: updated.amount, currency: updated.currency, createdAt: updated.createdAt, completedAt: updated.completedAt });
  }
}
