import { PlatformTenantProfile } from '../../../core/security/runtime-config';
import { DispatchAssignee, DispatchEvent, DispatchOrder, HandoffNote, ProofOfDelivery } from '../../domain/logistics.models';

export interface MockLogisticsFixture {
  readonly dispatches: readonly DispatchOrder[];
  readonly events: readonly DispatchEvent[];
  readonly handoffNotes: readonly HandoffNote[];
  readonly assignees: readonly DispatchAssignee[];
  readonly proof: readonly ProofOfDelivery[];
}

const DEMO_NOW = '2026-08-26T10:00:00Z';

function fixture(profile: PlatformTenantProfile): MockLogisticsFixture {
  const icisa = profile === 'icisa';
  const prefix = icisa ? 'ICISA' : 'GEN';
  const clientName = icisa ? 'Frío Andino S.A.C.' : 'Generic Demo Buyer S.A.C.';
  const destination = icisa ? 'Av. Néstor Gambetta 850, Callao' : 'Av. Demo 123, Lima';
  const assigneeId = `${profile}-membership-logistics-001`;
  const dispatches: DispatchOrder[] = [
    {
      id: `${profile}-dispatch-001`, dispatchNumber: `DO-${prefix}-001`, reservationId: `${profile}-reservation-001`,
      salesOrderId: `${profile}-sales-order-002`, salesOrderNumber: `SO-${prefix}-002`, clientAccountId: `${profile}-client-001`,
      clientCode: icisa ? 'ICISA-001' : 'GEN-001', clientName, status: 'READY_FOR_OPERATIONS', destination,
      deliveryArea: icisa ? 'Callao' : 'Lima Centro', priority: 'HIGH', deliveryWindowStart: '2026-08-27T09:00:00Z',
      deliveryWindowEnd: '2026-08-27T12:00:00Z', eta: null, assignment: null, temperatureMin: 2, temperatureMax: 8,
      temperatureUnit: 'CELSIUS', temperatureStatus: 'NORMAL', podId: null, podStatus: 'PENDING', version: 1,
      updatedAt: DEMO_NOW, alerts: []
    },
    {
      id: `${profile}-dispatch-002`, dispatchNumber: `DO-${prefix}-002`, reservationId: null,
      salesOrderId: `${profile}-sales-order-001`, salesOrderNumber: `SO-${prefix}-001`, clientAccountId: `${profile}-client-002`,
      clientCode: icisa ? 'ICISA-002' : 'GEN-002', clientName: icisa ? 'Restaurante Costa Fría S.A.C.' : 'Generic Demo Retail S.A.C.',
      status: 'SCHEDULED', destination: icisa ? 'Jr. de la Unión 500, Lima' : 'Av. Brasil 500, Lima',
      deliveryArea: 'Lima Centro', priority: 'NORMAL', deliveryWindowStart: '2026-08-27T14:00:00Z',
      deliveryWindowEnd: '2026-08-27T17:00:00Z', eta: '2026-08-27T15:00:00Z',
      assignment: { responsibleMembershipId: assigneeId, responsibleDisplayName: 'Operaciones Demo', vehicleReference: 'TRK-001', routeName: 'Ruta Centro' },
      temperatureMin: 2, temperatureMax: 8, temperatureUnit: 'CELSIUS', temperatureStatus: 'NORMAL', podId: null,
      podStatus: 'PENDING', version: 3, updatedAt: '2026-08-26T09:30:00Z', alerts: []
    },
    {
      id: `${profile}-dispatch-003`, dispatchNumber: `DO-${prefix}-003`, reservationId: null,
      salesOrderId: `${profile}-sales-order-001`, salesOrderNumber: `SO-${prefix}-001`, clientAccountId: `${profile}-client-002`,
      clientCode: icisa ? 'ICISA-002' : 'GEN-002', clientName: icisa ? 'Restaurante Costa Fría S.A.C.' : 'Generic Demo Retail S.A.C.',
      status: 'DELIVERED', destination, deliveryArea: icisa ? 'Callao' : 'Lima Centro', priority: 'NORMAL',
      deliveryWindowStart: '2026-08-25T09:00:00Z', deliveryWindowEnd: '2026-08-25T12:00:00Z', eta: '2026-08-25T10:10:00Z',
      assignment: { responsibleMembershipId: assigneeId, responsibleDisplayName: 'Operaciones Demo', vehicleReference: 'TRK-001', routeName: 'Ruta Callao' },
      temperatureMin: 2, temperatureMax: 8, temperatureUnit: 'CELSIUS', temperatureStatus: 'NORMAL', podId: `${profile}-pod-003`,
      podStatus: 'COMPLETED', version: 4, updatedAt: '2026-08-25T11:10:00Z', alerts: []
    }
  ];
  const events: DispatchEvent[] = dispatches.map((item, index) => ({
    id: `${item.id}-event-001`, type: 'STATUS_CHANGED', fromStatus: null, toStatus: item.status,
    occurredAt: item.updatedAt, buyerVisible: item.status === 'DELIVERED', summary: index === 0 ? 'Reserva lista para operación.' : 'Estado demo inicial.'
  }));
  const proof: ProofOfDelivery[] = [
    { podId: null, dispatchOrderId: dispatches[0].id, dispatchNumber: dispatches[0].dispatchNumber, status: 'PENDING', receiverName: null, completedAt: null, notes: null, photoEvidenceDeclared: false, signatureEvidenceDeclared: false, updatedAt: DEMO_NOW },
    { podId: null, dispatchOrderId: dispatches[1].id, dispatchNumber: dispatches[1].dispatchNumber, status: 'PENDING', receiverName: null, completedAt: null, notes: null, photoEvidenceDeclared: false, signatureEvidenceDeclared: false, updatedAt: DEMO_NOW },
    { podId: dispatches[2].podId, dispatchOrderId: dispatches[2].id, dispatchNumber: dispatches[2].dispatchNumber, status: 'COMPLETED', receiverName: 'María Demo', completedAt: '2026-08-25T11:10:00Z', notes: 'Entrega recibida sin observaciones.', photoEvidenceDeclared: true, signatureEvidenceDeclared: true, updatedAt: '2026-08-25T11:10:00Z' }
  ];
  return {
    dispatches,
    events,
    handoffNotes: [{ id: `${profile}-handoff-001`, dispatchOrderId: dispatches[1].id, note: 'Cadena de frío verificada antes de salida.', authorMembershipId: assigneeId, occurredAt: '2026-08-26T09:35:00Z', dispatchVersion: dispatches[1].version }],
    assignees: [{ id: assigneeId, email: `logistics@${profile}.nexa.test`, displayName: 'Operaciones Demo' }],
    proof
  };
}

export const MOCK_LOGISTICS_FIXTURES: Readonly<Record<PlatformTenantProfile, MockLogisticsFixture>> = {
  generic: fixture('generic'),
  icisa: fixture('icisa')
};
