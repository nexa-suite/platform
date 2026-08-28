import { PlatformTenantProfile } from '../../../core/security/runtime-config';
import { PaymentSummary } from '../../domain/payment.models';

export const MOCK_PAYMENT_FIXTURES: Readonly<Record<PlatformTenantProfile, readonly PaymentSummary[]>> = {
  generic: [
    { id: 'generic-payment-001', receivableId: 'generic-receivable-001', receivableNumber: 'AR-GEN-001', clientAccountId: 'generic-client-001', method: 'BANK_TRANSFER', status: 'PROCESSING', amount: 1280.5, currency: 'PEN', reference: 'GEN-TRANSFER-001', reviewReason: null, createdAt: '2026-08-26T08:15:00Z', completedAt: null },
    { id: 'generic-payment-002', receivableId: 'generic-receivable-002', receivableNumber: 'AR-GEN-002', clientAccountId: 'generic-client-002', method: 'BANK_TRANSFER', status: 'PROCESSING', amount: 845, currency: 'PEN', reference: 'GEN-TRANSFER-002', reviewReason: null, createdAt: '2026-08-26T09:10:00Z', completedAt: null }
  ],
  icisa: [
    { id: 'icisa-payment-001', receivableId: 'icisa-receivable-001', receivableNumber: 'AR-ICISA-001', clientAccountId: 'icisa-client-001', method: 'BANK_TRANSFER', status: 'PROCESSING', amount: 2490.75, currency: 'PEN', reference: 'ICISA-TRANSFER-001', reviewReason: null, createdAt: '2026-08-26T08:15:00Z', completedAt: null },
    { id: 'icisa-payment-002', receivableId: 'icisa-receivable-002', receivableNumber: 'AR-ICISA-002', clientAccountId: 'icisa-client-002', method: 'BANK_TRANSFER', status: 'PROCESSING', amount: 990, currency: 'PEN', reference: 'ICISA-TRANSFER-002', reviewReason: null, createdAt: '2026-08-26T09:10:00Z', completedAt: null }
  ]
};
