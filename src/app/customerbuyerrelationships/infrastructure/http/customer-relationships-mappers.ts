import {
  ClientAccount,
  ClientAccountAddress,
  ClientAccountPage,
  PeruReferenceOption
} from '../../domain/client-account.models';

export type ApiRecord = Readonly<Record<string, unknown>>;

export interface ApiPageDto extends ApiRecord {
  readonly items?: readonly ApiRecord[];
  readonly page?: number;
  readonly size?: number;
  readonly totalItems?: number;
  readonly total?: number;
  readonly totalPages?: number;
  readonly sort?: ApiRecord;
}

const record = (value: unknown): ApiRecord => value !== null && typeof value === 'object' ? value as ApiRecord : {};

const stringValue = (value: ApiRecord, ...keys: string[]): string => {
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string') return candidate;
  }
  return '';
};

const nullableString = (value: ApiRecord, ...keys: string[]): string | null => stringValue(value, ...keys) || null;

const numberValue = (value: ApiRecord, ...keys: string[]): number => {
  for (const key of keys) {
    const candidate = value[key];
    const number = typeof candidate === 'number' ? candidate : typeof candidate === 'string' ? Number(candidate) : NaN;
    if (Number.isFinite(number)) return number;
  }
  return 0;
};

export function toClientAccount(value: ApiRecord): ClientAccount {
  return {
    id: stringValue(value, 'clientAccountId', 'id'),
    code: stringValue(value, 'clientAccountCode', 'code'),
    businessName: stringValue(value, 'businessName', 'legalName'),
    commercialName: stringValue(value, 'commercialName', 'tradeName'),
    countryCode: stringValue(value, 'countryCode', 'taxCountryCode'),
    taxType: stringValue(value, 'taxType', 'taxIdentifierType'),
    taxValue: stringValue(value, 'taxValue', 'taxIdentifierValue'),
    segment: stringValue(value, 'segment'),
    contactPerson: stringValue(value, 'contactPerson', 'contactName'),
    contactEmail: stringValue(value, 'contactEmail', 'email'),
    phone: stringValue(value, 'phone', 'contactPhone'),
    deliveryProfile: stringValue(value, 'deliveryProfile'),
    paymentCondition: stringValue(value, 'paymentCondition'),
    status: stringValue(value, 'status'),
    buyerMembershipId: nullableString(value, 'buyerMembershipId'),
    version: numberValue(value, 'version')
  };
}

function toPage<T>(response: ApiPageDto, mapper: (value: ApiRecord) => T): {
  readonly items: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly sort: { readonly field: string; readonly direction: 'asc' | 'desc' };
} {
  const page = numberValue(response, 'page');
  const size = numberValue(response, 'size') || 25;
  const totalItems = numberValue(response, 'totalItems', 'total');
  const sort = record(response.sort);
  return {
    items: (response.items ?? []).map(mapper),
    page,
    size,
    totalItems,
    totalPages: numberValue(response, 'totalPages') || Math.ceil(totalItems / size),
    sort: {
      field: stringValue(sort, 'field') || 'createdAt',
      direction: stringValue(sort, 'direction').toLowerCase() === 'asc' ? 'asc' : 'desc'
    }
  };
}

export function toClientAccountPage(response: ApiPageDto): ClientAccountPage {
  return toPage(response, toClientAccount);
}

export function toReferenceOption(value: ApiRecord): PeruReferenceOption {
  return {
    id: numberValue(value, 'id'),
    code: stringValue(value, 'code'),
    label: stringValue(value, 'label', 'name'),
    parentCode: nullableString(value, 'parentCode'),
    active: value['active'] !== false
  };
}

export function toClientAccountAddress(value: ApiRecord, etag?: string | null): ClientAccountAddress {
  return {
    id: String(value['id'] ?? ''),
    clientAccountId: String(value['clientAccountId'] ?? ''),
    label: String(value['label'] ?? ''),
    addressType: String(value['addressType'] ?? 'STREET'),
    line: String(value['line'] ?? ''),
    reference: String(value['reference'] ?? ''),
    countryCode: String(value['countryCode'] ?? 'PE'),
    departmentCode: String(value['departmentCode'] ?? ''),
    provinceCode: String(value['provinceCode'] ?? ''),
    districtCode: String(value['districtCode'] ?? ''),
    defaultAddress: value['defaultAddress'] === true,
    active: value['active'] !== false,
    version: Number(value['version']) || 0,
    recipientName: value['recipientName'] ? String(value['recipientName']) : null,
    recipientPhone: value['recipientPhone'] ? String(value['recipientPhone']) : null,
    roadType: value['roadType'] ? String(value['roadType']) : null,
    streetName: value['streetName'] ? String(value['streetName']) : null,
    streetNumber: value['streetNumber'] ? String(value['streetNumber']) : null,
    interior: value['interior'] ? String(value['interior']) : null,
    postalCode: value['postalCode'] ? String(value['postalCode']) : null,
    receivingInstructions: value['receivingInstructions'] ? String(value['receivingInstructions']) : null,
    receivingHours: value['receivingHours'] ? String(value['receivingHours']) : null,
    latitude: value['latitude'] == null ? null : Number(value['latitude']),
    longitude: value['longitude'] == null ? null : Number(value['longitude']),
    placeId: value['placeId'] ? String(value['placeId']) : null,
    source: value['source'] ? String(value['source']) : null
  };
}
