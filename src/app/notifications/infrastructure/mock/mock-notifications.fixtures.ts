import { PlatformTenantProfile } from '../../../core/security/runtime-config';
import { PlatformNotification } from '../../domain/notification.models';

export const MOCK_NOTIFICATION_FIXTURES: Readonly<Record<PlatformTenantProfile, readonly PlatformNotification[]>> = {
  generic: [
    { id: 'generic-notification-001', category: 'inventory', title: 'Inventory reservation ready', message: 'A reservation is ready for dispatch preparation.', deepLink: '/ops/operations/fulfillment-readiness', subjectType: 'INVENTORY_RESERVATION', createdAt: '2026-08-26T09:30:00Z', read: false },
    { id: 'generic-notification-002', category: 'payment', title: 'Bank transfer pending review', message: 'A buyer transfer is waiting for reconciliation.', deepLink: '/ops/finance/bank-transfers', subjectType: 'PAYMENT', createdAt: '2026-08-26T08:45:00Z', read: false }
  ],
  icisa: [
    { id: 'icisa-notification-001', category: 'inventory', title: 'Reserva ICISA lista', message: 'La reserva ICISA-001 está lista para preparación de despacho.', deepLink: '/ops/operations/fulfillment-readiness', subjectType: 'INVENTORY_RESERVATION', createdAt: '2026-08-26T09:30:00Z', read: false },
    { id: 'icisa-notification-002', category: 'payment', title: 'Transferencia ICISA pendiente', message: 'La transferencia ICISA-TRANSFER-001 requiere revisión.', deepLink: '/ops/finance/bank-transfers', subjectType: 'PAYMENT', createdAt: '2026-08-26T08:45:00Z', read: false },
    { id: 'icisa-notification-003', category: 'logistics', title: 'Despacho programado', message: 'DO-ICISA-002 tiene una ventana de entrega programada.', deepLink: '/ops/operations/dispatch-orders', subjectType: 'DISPATCH_ORDER', createdAt: '2026-08-26T07:15:00Z', read: true }
  ]
};
