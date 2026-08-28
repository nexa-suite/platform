import { PlatformTenantProfile } from '../../../core/security/runtime-config';
import { ManualOrderClient } from '../../domain/manual-orders/manual-order.models';
import { PurchaseRequest, PurchaseRequestEvent, PurchaseRequestLine } from '../../domain/purchase-requests/purchase-request.models';
import { FulfillmentCandidate, SalesOrder, SalesOrderEvent, SalesOrderLine } from '../../domain/sales-orders/sales-order.models';

export interface MockSalesCatalogReference {
  readonly id: string;
  readonly productFamily: string;
  readonly familyCode: string;
  readonly skuCode: string;
  readonly name: string;
  readonly presentation: string;
  readonly unit: string;
  readonly price: number;
  readonly currency: string;
  readonly availabilityStatus: string;
}

export interface MockSalesAddressReference {
  readonly id: string;
  readonly addressSnapshot: string;
}

export interface MockSalesFixture {
  readonly client: ManualOrderClient;
  readonly clients: readonly ManualOrderClient[];
  readonly catalog: readonly MockSalesCatalogReference[];
  readonly addresses: readonly MockSalesAddressReference[];
  readonly purchaseRequests: readonly PurchaseRequest[];
  readonly salesOrders: readonly SalesOrder[];
  readonly purchaseRequestEvents: Readonly<Record<string, readonly PurchaseRequestEvent[]>>;
  readonly salesOrderEvents: Readonly<Record<string, readonly SalesOrderEvent[]>>;
  readonly fulfillmentCandidates: readonly FulfillmentCandidate[];
}

function purchaseLine(reference: MockSalesCatalogReference, quantity: number): PurchaseRequestLine {
  return {
    id: `${reference.id}-line`,
    catalogItemId: reference.id,
    itemName: reference.name,
    presentation: reference.presentation,
    quantity,
    unit: reference.unit,
    unitPriceAmount: reference.price,
    unitPriceCurrency: reference.currency,
    notes: null
  };
}

function salesLine(reference: MockSalesCatalogReference, quantity: number): SalesOrderLine {
  return {
    id: `${reference.id}-order-line`,
    catalogItemId: reference.id,
    itemName: reference.name,
    presentation: reference.presentation,
    quantity,
    unit: reference.unit,
    unitPriceAmount: reference.price,
    unitPriceCurrency: reference.currency,
    lineTotalAmount: reference.price * quantity
  };
}

function order(
  profile: PlatformTenantProfile,
  id: string,
  number: string,
  purchaseRequestId: string,
  status: SalesOrder['status'],
  client: ManualOrderClient,
  line: SalesOrderLine,
  version: number,
): SalesOrder {
  const createdAt = '2026-01-15T10:00:00Z';
  return {
    id,
    number,
    purchaseRequestId,
    clientAccountId: client.id,
    createdByMembershipId: `mock-${profile}-membership`,
    buyerMembershipId: `mock-${profile}-buyer-001`,
    clientAccountName: client.businessName,
    priority: status === 'CONFIRMED' ? 'HIGH' : 'NORMAL',
    requestedDeliveryDate: '2026-02-20',
    deliverySnapshot: JSON.stringify({ roadType: 'AV', street: 'Demo', number: '123', district: 'SMP' }),
    paymentOption: 'CREDIT_LINE',
    notes: 'Demo order; no server persistence.',
    currency: client.id.startsWith('icisa-') ? 'PEN' : 'PEN',
    total: line.lineTotalAmount,
    status,
    tenantId: `mock-${profile}-tenant`,
    workspaceId: `mock-${profile}-workspace`,
    lines: [line],
    version,
    createdAt,
    updatedAt: createdAt,
    confirmedAt: status === 'CONFIRMED' ? '2026-01-15T11:00:00Z' : null,
    rejectedAt: status === 'REJECTED' ? '2026-01-15T11:00:00Z' : null,
    cancelledAt: status === 'CANCELLED' ? '2026-01-15T11:00:00Z' : null
  };
}

function fixture(profile: PlatformTenantProfile): MockSalesFixture {
  const icisa = profile === 'icisa';
  const client: ManualOrderClient = icisa
    ? {
        id: 'icisa-client-001',
        code: 'ICISA-001',
        businessName: 'Importaciones y Comercializadora ICISA S.A.C.',
        commercialName: 'ICISA',
        taxIdentifierType: 'RUC',
        taxIdentifierValue: '20512345678',
        status: 'ACTIVE',
        paymentTerms: 'NET_30',
        creditLimit: 100000,
        currentExposure: 28400,
        availableCredit: 71600
      }
    : {
        id: 'generic-client-001',
        code: 'GEN-001',
        businessName: 'Generic Fresh Foods S.A.C.',
        commercialName: 'Generic Fresh',
        taxIdentifierType: 'RUC',
        taxIdentifierValue: '20999999991',
        status: 'ACTIVE',
        paymentTerms: 'NET_30',
        creditLimit: 50000,
        currentExposure: 9500,
        availableCredit: 40500
      };
  const alternateClient: ManualOrderClient = icisa
    ? {
        id: 'icisa-client-002',
        code: 'ICISA-002',
        businessName: 'Restaurantes Frío Andino S.A.C.',
        commercialName: 'Frío Andino',
        taxIdentifierType: 'RUC',
        taxIdentifierValue: '20587654321',
        status: 'ACTIVE',
        paymentTerms: 'NET_15',
        creditLimit: 75000,
        currentExposure: 12000,
        availableCredit: 63000
      }
    : {
        id: 'generic-client-002',
        code: 'GEN-002',
        businessName: 'North Demo Market S.A.C.',
        commercialName: 'North Demo Market',
        taxIdentifierType: 'RUC',
        taxIdentifierValue: '20999999992',
        status: 'SUSPENDED',
        paymentTerms: 'PREPAID',
        creditLimit: 25000,
        currentExposure: 25000,
        availableCredit: 0
      };

  const catalog: readonly MockSalesCatalogReference[] = icisa
    ? [
        { id: 'icisa-catalog-001', productFamily: 'Queso Gouda', familyCode: 'GESTAM-GOUDA', skuCode: 'GESTAM-GOUDA-NAT-45', name: 'Queso Gouda Natural', presentation: 'Molde 4.5 kg', unit: 'KG', price: 49.9, currency: 'PEN', availabilityStatus: 'IN_STOCK' },
        { id: 'icisa-catalog-002', productFamily: 'Salame Milano', familyCode: 'CAVOUR-SALAME', skuCode: 'CAVOUR-SALAME-MILANO-25', name: 'Salame Milano', presentation: 'Molde 2.5 kg', unit: 'KG', price: 64.5, currency: 'PEN', availabilityStatus: 'IN_STOCK' },
        { id: 'icisa-catalog-003', productFamily: 'Parmigiano Reggiano DOP', familyCode: 'AGRIFORM-PARMIGIANO', skuCode: 'AGRIFORM-PARMIGIANO-150', name: 'Queso Parmigiano Reggiano DOP', presentation: 'Corte 150 g', unit: 'UNIT', price: 16.9, currency: 'PEN', availabilityStatus: 'LOW_STOCK' }
      ]
    : [
        { id: 'generic-catalog-001', productFamily: 'Demo cheese assortment', familyCode: 'GEN-CHEESE', skuCode: 'GEN-CHEESE-001', name: 'Demo Gouda Natural', presentation: 'Whole 4.5 kg', unit: 'KG', price: 42.9, currency: 'PEN', availabilityStatus: 'IN_STOCK' },
        { id: 'generic-catalog-002', productFamily: 'Demo butter', familyCode: 'GEN-BUTTER', skuCode: 'GEN-BUTTER-001', name: 'Demo Salted Butter', presentation: 'Case 20 x 10 g', unit: 'CASE', price: 18.5, currency: 'PEN', availabilityStatus: 'LOW_STOCK' },
        { id: 'generic-catalog-003', productFamily: 'Demo frozen dessert', familyCode: 'GEN-DESSERT', skuCode: 'GEN-DESSERT-001', name: 'Demo Panna Cotta Caramel', presentation: 'Pack 2 x 90 g', unit: 'PACK', price: 12.75, currency: 'PEN', availabilityStatus: 'IN_STOCK' }
      ];

  const first = catalog[0];
  const second = catalog[1];
  const requestIds = {
    submitted: `${profile}-purchase-request-001`,
    review: `${profile}-purchase-request-002`,
    approved: `${profile}-purchase-request-003`
  } as const;
  const purchaseRequests: readonly PurchaseRequest[] = [
    {
      id: requestIds.submitted,
      code: icisa ? 'PR-ICISA-001' : 'PR-GEN-001',
      clientAccountId: client.id,
      buyerMembershipId: `mock-${profile}-buyer-001`,
      status: 'SUBMITTED',
      priority: 'HIGH',
      requestedDeliveryDate: '2026-02-20',
      lineCount: 2,
      deliveryProfileSnapshot: 'Cold-chain standard',
      paymentOption: 'CREDIT_LINE',
      comment: 'Demo purchase request waiting for review.',
      reviewNote: null,
      lines: [purchaseLine(first, 4), purchaseLine(second, 2)],
      version: 1
    },
    {
      id: requestIds.review,
      code: icisa ? 'PR-ICISA-002' : 'PR-GEN-002',
      clientAccountId: client.id,
      buyerMembershipId: `mock-${profile}-buyer-001`,
      status: 'IN_REVIEW',
      priority: 'NORMAL',
      requestedDeliveryDate: '2026-02-22',
      lineCount: 1,
      deliveryProfileSnapshot: 'Cold-chain standard',
      paymentOption: 'BANK_TRANSFER',
      comment: 'Demo request under commercial review.',
      reviewNote: 'Validar ventana de recepción.',
      lines: [purchaseLine(first, 2)],
      version: 2
    },
    {
      id: requestIds.approved,
      code: icisa ? 'PR-ICISA-003' : 'PR-GEN-003',
      clientAccountId: client.id,
      buyerMembershipId: `mock-${profile}-buyer-001`,
      status: 'APPROVED',
      priority: 'NORMAL',
      requestedDeliveryDate: '2026-02-25',
      lineCount: 1,
      deliveryProfileSnapshot: 'Cold-chain standard',
      paymentOption: 'CREDIT_LINE',
      comment: 'Demo request ready for conversion.',
      reviewNote: 'Approved in demo fixture.',
      lines: [purchaseLine(second, 1)],
      version: 3
    }
  ];

  const orderOne = order(profile, `${profile}-sales-order-001`, icisa ? 'SO-ICISA-001' : 'SO-GEN-001', requestIds.approved, 'PENDING', client, salesLine(second, 1), 0);
  const orderTwo = order(profile, `${profile}-sales-order-002`, icisa ? 'SO-ICISA-002' : 'SO-GEN-002', requestIds.submitted, 'CONFIRMED', client, salesLine(first, 4), 1);
  const addresses: readonly MockSalesAddressReference[] = [
    {
      id: `${profile}-address-001`,
      addressSnapshot: JSON.stringify(icisa
        ? { roadType: 'AV', street: 'Néstor Gambetta', number: '850', district: 'SMP', reference: 'Ingreso por puerta 2' }
        : { roadType: 'AV', street: 'Demo', number: '123', district: 'SMP', reference: 'Puerta azul' })
    },
    {
      id: `${profile}-address-002`,
      addressSnapshot: JSON.stringify(icisa
        ? { roadType: 'AV', street: 'Separadora Industrial', number: '220', district: 'ATE', reference: 'Frente al centro logístico' }
        : { roadType: 'AV', street: 'Los Olivos', number: '456', district: 'SMP', reference: 'Ingreso principal' })
    }
  ];

  return {
    client,
    clients: [client, alternateClient],
    catalog,
    addresses,
    purchaseRequests,
    salesOrders: [orderOne, orderTwo],
    purchaseRequestEvents: {
      [requestIds.submitted]: [
        { id: `${requestIds.submitted}-event-1`, type: 'CREATED', occurredAt: '2026-01-14T09:00:00Z', actorDisplayName: 'Demo Buyer', note: null, status: 'DRAFT' },
        { id: `${requestIds.submitted}-event-2`, type: 'SUBMITTED', occurredAt: '2026-01-14T09:10:00Z', actorDisplayName: 'Demo Buyer', note: null, status: 'SUBMITTED' }
      ],
      [requestIds.review]: [{ id: `${requestIds.review}-event-1`, type: 'REVIEW_REQUESTED', occurredAt: '2026-01-14T12:00:00Z', actorDisplayName: 'Demo Sales', note: null, status: 'IN_REVIEW' }],
      [requestIds.approved]: [{ id: `${requestIds.approved}-event-1`, type: 'APPROVED', occurredAt: '2026-01-15T08:00:00Z', actorDisplayName: 'Demo Sales', note: 'Approved in demo fixture.', status: 'APPROVED' }]
    },
    salesOrderEvents: {
      [orderOne.id]: [{ id: `${orderOne.id}-event-1`, type: 'CREATED', occurredAt: orderOne.createdAt, actorDisplayName: 'Demo Sales', note: null, status: 'PENDING' }],
      [orderTwo.id]: [
        { id: `${orderTwo.id}-event-1`, type: 'CREATED', occurredAt: orderTwo.createdAt, actorDisplayName: 'Demo Sales', note: null, status: 'PENDING' },
        { id: `${orderTwo.id}-event-2`, type: 'CONFIRMED', occurredAt: orderTwo.confirmedAt ?? orderTwo.updatedAt, actorDisplayName: 'Demo Warehouse', note: null, status: 'CONFIRMED' }
      ]
    },
    fulfillmentCandidates: [{
      salesOrderId: orderTwo.id,
      salesOrderNumber: orderTwo.number,
      clientAccountId: client.id,
      clientAccountName: client.businessName,
      status: 'AWAITING_INVENTORY_RESERVATION',
      warehouseId: `${profile}-warehouse-001`,
      logisticsEligibleAt: '2026-01-15T11:00:00Z'
    }]
  };
}

export const MOCK_SALES_FIXTURES: Readonly<Record<PlatformTenantProfile, MockSalesFixture>> = {
  generic: fixture('generic'),
  icisa: fixture('icisa')
};
