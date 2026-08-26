import { Observable } from 'rxjs';
import { PaymentPage, PaymentReviewResult } from '../payment.models';

export abstract class PaymentsApiPort {
  abstract listPendingBankTransfers(page?: number, size?: number): Observable<PaymentPage>;
  abstract approveBankTransfer(paymentId: string, idempotencyKey?: string): Observable<PaymentReviewResult>;
  abstract rejectBankTransfer(paymentId: string, reason: string, idempotencyKey?: string): Observable<PaymentReviewResult>;
}
