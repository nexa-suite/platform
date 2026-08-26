import { Injectable, inject } from '@angular/core';
import { PaymentsApiPort } from '../domain/ports/payments-api.port';

/** Application boundary for payment review; the UI does not own HTTP calls. */
@Injectable({ providedIn: 'root' })
export class PaymentsFacade {
  private readonly api = inject(PaymentsApiPort);

  readonly listPendingBankTransfers = (...args: Parameters<PaymentsApiPort['listPendingBankTransfers']>) => this.api.listPendingBankTransfers(...args);
  readonly approveBankTransfer = (...args: Parameters<PaymentsApiPort['approveBankTransfer']>) => this.api.approveBankTransfer(...args);
  readonly rejectBankTransfer = (...args: Parameters<PaymentsApiPort['rejectBankTransfer']>) => this.api.rejectBankTransfer(...args);
}
