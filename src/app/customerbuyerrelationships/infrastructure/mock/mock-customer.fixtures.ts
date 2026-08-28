import { PlatformTenantProfile } from '../../../core/security/runtime-config';
import {
  BuyerMembershipCandidate,
  ClientAccount,
  ClientAccountAddress,
  PeruReferenceOption
} from '../../domain/client-account.models';

/** Deterministic BC-02 demo data shared by account and manual-order flows. */
export interface MockCustomerFixture {
  readonly accounts: readonly ClientAccount[];
  readonly addresses: readonly ClientAccountAddress[];
  readonly buyerMembershipCandidates: readonly BuyerMembershipCandidate[];
  readonly references: Readonly<{
    departments: readonly PeruReferenceOption[];
    provinces: readonly PeruReferenceOption[];
    districts: readonly PeruReferenceOption[];
    'road-types': readonly PeruReferenceOption[];
  }>;
}

const GENERIC_REFERENCES = {
  departments: [{ id: 1, code: 'LIM', label: 'Lima', parentCode: null, active: true }],
  provinces: [{ id: 2, code: 'LIM', label: 'Lima', parentCode: 'LIM', active: true }],
  districts: [{ id: 3, code: 'SMP', label: 'San Martín de Porres', parentCode: 'LIM', active: true }],
  'road-types': [{ id: 4, code: 'AV', label: 'Avenida', parentCode: null, active: true }]
} as const;

const ICISA_REFERENCES = {
  departments: [{ id: 11, code: 'LIM', label: 'Lima', parentCode: null, active: true }],
  provinces: [{ id: 12, code: 'LIM', label: 'Lima', parentCode: 'LIM', active: true }],
  districts: [
    { id: 13, code: 'SMP', label: 'San Martín de Porres', parentCode: 'LIM', active: true },
    { id: 14, code: 'ATE', label: 'Ate', parentCode: 'LIM', active: true }
  ],
  'road-types': [{ id: 15, code: 'AV', label: 'Avenida', parentCode: null, active: true }]
} as const;

export const MOCK_CUSTOMER_FIXTURES: Readonly<Record<PlatformTenantProfile, MockCustomerFixture>> = {
  generic: {
    accounts: [
      {
        id: 'generic-client-001',
        code: 'GEN-001',
        businessName: 'Generic Fresh Foods S.A.C.',
        commercialName: 'Generic Fresh',
        countryCode: 'PE',
        taxType: 'RUC',
        taxValue: '20999999991',
        segment: 'DISTRIBUTOR',
        contactPerson: 'Ana Demo',
        contactEmail: 'ana@generic.nexa.test',
        phone: '+51 999 000 001',
        deliveryProfile: 'Cold-chain standard',
        paymentCondition: 'NET_30',
        status: 'ACTIVE',
        buyerMembershipId: 'generic-buyer-001',
        version: 0
      },
      {
        id: 'generic-client-002',
        code: 'GEN-002',
        businessName: 'North Demo Market S.A.C.',
        commercialName: 'North Demo Market',
        countryCode: 'PE',
        taxType: 'RUC',
        taxValue: '20999999992',
        segment: 'RETAIL',
        contactPerson: 'Luis Demo',
        contactEmail: 'luis@generic.nexa.test',
        phone: '+51 999 000 002',
        deliveryProfile: 'Frozen standard',
        paymentCondition: 'PREPAID',
        status: 'SUSPENDED',
        buyerMembershipId: null,
        version: 1
      }
    ],
    addresses: [
      {
        id: 'generic-address-001',
        clientAccountId: 'generic-client-001',
        label: 'Almacén principal',
        addressType: 'WAREHOUSE',
        line: 'Av. Demo 123, San Martín de Porres',
        reference: 'Puerta azul',
        countryCode: 'PE',
        departmentCode: 'LIM',
        provinceCode: 'LIM',
        districtCode: 'SMP',
        defaultAddress: true,
        active: true,
        version: 0,
        recipientName: 'Ana Demo',
        recipientPhone: '+51 999 000 001',
        roadType: 'AV',
        streetName: 'Demo',
        streetNumber: '123',
        receivingInstructions: 'Recibir en zona refrigerada',
        receivingHours: '08:00-17:00',
        source: 'MOCK_DEMO'
      }
    ],
    buyerMembershipCandidates: [
      { id: 'generic-buyer-001', email: 'buyer@generic.nexa.test', displayName: 'Generic Buyer' }
    ],
    references: GENERIC_REFERENCES
  },
  icisa: {
    accounts: [
      {
        id: 'icisa-client-001',
        code: 'ICISA-001',
        businessName: 'Importaciones y Comercializadora ICISA S.A.C.',
        commercialName: 'ICISA',
        countryCode: 'PE',
        taxType: 'RUC',
        taxValue: '20512345678',
        segment: 'DISTRIBUTOR',
        contactPerson: 'Carlos Mendoza',
        contactEmail: 'carlos@icisa.pe',
        phone: '+51 999 123 456',
        deliveryProfile: 'Cold-chain standard',
        paymentCondition: 'NET_30',
        status: 'ACTIVE',
        buyerMembershipId: 'icisa-buyer-001',
        version: 2
      },
      {
        id: 'icisa-client-002',
        code: 'ICISA-002',
        businessName: 'Restaurantes Frío Andino S.A.C.',
        commercialName: 'Frío Andino',
        countryCode: 'PE',
        taxType: 'RUC',
        taxValue: '20587654321',
        segment: 'HORECA',
        contactPerson: 'Elena Rojas',
        contactEmail: 'elena@icisa.pe',
        phone: '+51 999 123 457',
        deliveryProfile: 'Refrigerated priority',
        paymentCondition: 'NET_15',
        status: 'ACTIVE',
        buyerMembershipId: 'icisa-buyer-002',
        version: 1
      }
    ],
    addresses: [
      {
        id: 'icisa-address-001',
        clientAccountId: 'icisa-client-001',
        label: 'Centro de distribución ICISA',
        addressType: 'WAREHOUSE',
        line: 'Av. Néstor Gambetta 850, Callao',
        reference: 'Ingreso por puerta 2',
        countryCode: 'PE',
        departmentCode: 'LIM',
        provinceCode: 'LIM',
        districtCode: 'SMP',
        defaultAddress: true,
        active: true,
        version: 2,
        recipientName: 'Carlos Mendoza',
        recipientPhone: '+51 999 123 456',
        roadType: 'AV',
        streetName: 'Néstor Gambetta',
        streetNumber: '850',
        receivingInstructions: 'Validar temperatura al arribo',
        receivingHours: '07:00-16:00',
        source: 'MOCK_DEMO'
      },
      {
        id: 'icisa-address-002',
        clientAccountId: 'icisa-client-002',
        label: 'Local Frío Andino',
        addressType: 'STORE',
        line: 'Av. Separadora Industrial 220, Ate',
        reference: 'Frente al centro logístico',
        countryCode: 'PE',
        departmentCode: 'LIM',
        provinceCode: 'LIM',
        districtCode: 'ATE',
        defaultAddress: true,
        active: true,
        version: 0,
        recipientName: 'Elena Rojas',
        recipientPhone: '+51 999 123 457',
        roadType: 'AV',
        streetName: 'Separadora Industrial',
        streetNumber: '220',
        receivingInstructions: 'Entrega con cita previa',
        receivingHours: '09:00-18:00',
        source: 'MOCK_DEMO'
      }
    ],
    buyerMembershipCandidates: [
      { id: 'icisa-buyer-001', email: 'carlos@icisa.pe', displayName: 'Carlos Mendoza' },
      { id: 'icisa-buyer-002', email: 'elena@icisa.pe', displayName: 'Elena Rojas' }
    ],
    references: ICISA_REFERENCES
  }
};
