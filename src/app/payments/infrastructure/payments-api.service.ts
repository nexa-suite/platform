import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG, platformApiUrl } from '../../core/security/runtime-config';
import { PaymentPage, PaymentReviewResult } from '../domain/payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);

  private api(path: string): string { return platformApiUrl(this.config, `/api/v1${path}`); }

  listPendingBankTransfers(page = 0, size = 25): Observable<PaymentPage> {
    const params = new HttpParams().set('page', page).set('size', size).set('method', 'BANK_TRANSFER').set('status', 'PROCESSING');
    return this.http.get<PaymentPage>(this.api('/payments'), { params });
  }

  approveBankTransfer(paymentId: string, idempotencyKey = crypto.randomUUID()): Observable<PaymentReviewResult> {
    return this.http.post<PaymentReviewResult>(this.api(`/payments/${encodeURIComponent(paymentId)}/bank-transfer/approve`), {}, { headers: this.headers(idempotencyKey) });
  }

  rejectBankTransfer(paymentId: string, reason: string, idempotencyKey = crypto.randomUUID()): Observable<PaymentReviewResult> {
    return this.http.post<PaymentReviewResult>(this.api(`/payments/${encodeURIComponent(paymentId)}/bank-transfer/reject`), { reason }, { headers: this.headers(idempotencyKey) });
  }

  private headers(idempotencyKey: string): HttpHeaders { return new HttpHeaders({ 'Idempotency-Key': idempotencyKey }); }
}
