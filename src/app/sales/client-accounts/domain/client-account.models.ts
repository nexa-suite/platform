export type ClientAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | string;
export type ClientAccountLoadStatus = 'idle' | 'loading' | 'retrying' | 'success' | 'empty' | 'error';

export interface ClientAccount {
  readonly id: string;
  readonly code: string;
  readonly businessName: string;
  readonly commercialName: string;
  readonly countryCode: string;
  readonly taxType: string;
  readonly taxValue: string;
  readonly segment: string;
  readonly contactPerson: string;
  readonly contactEmail: string;
  readonly phone: string;
  readonly deliveryProfile: string;
  readonly paymentCondition: string;
  readonly status: ClientAccountStatus;
  readonly buyerMembershipId: string | null;
  readonly version: number;
}

export interface ClientAccountAddress {
  readonly id: string;
  readonly clientAccountId: string;
  readonly label: string;
  readonly addressType: string;
  readonly line: string;
  readonly reference: string;
  readonly countryCode: string;
  readonly departmentCode: string;
  readonly provinceCode: string;
  readonly districtCode: string;
  readonly defaultAddress: boolean;
  readonly active: boolean;
  readonly version: number;
  readonly recipientName?: string | null;
  readonly recipientPhone?: string | null;
  readonly roadType?: string | null;
  readonly streetName?: string | null;
  readonly streetNumber?: string | null;
  readonly interior?: string | null;
  readonly postalCode?: string | null;
  readonly receivingInstructions?: string | null;
  readonly receivingHours?: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly placeId?: string | null;
  readonly source?: string | null;
}

export interface PeruReferenceOption {
  readonly id: number;
  readonly code: string;
  readonly label: string;
  readonly parentCode: string | null;
  readonly active: boolean;
}

export interface ClientAccountPage {
  readonly items: readonly ClientAccount[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly sort: { readonly field: string; readonly direction: 'asc' | 'desc' };
}

export interface ClientAccountFilters {
  readonly q: string;
  readonly status: string;
  readonly buyerMembershipId: string;
  readonly page: number;
  readonly size: number;
  readonly sort: 'code' | 'businessName' | 'commercialName' | 'status' | 'createdAt';
  readonly direction: 'asc' | 'desc';
}

export interface ClientAccountCreateCommand {
  readonly code: string;
  readonly businessName: string;
  readonly commercialName: string;
  readonly countryCode: string;
  readonly taxType: string;
  readonly taxValue: string;
  readonly segment: string;
  readonly contactPerson: string;
  readonly contactEmail: string;
  readonly phone: string;
  readonly deliveryProfile: string;
  readonly paymentCondition: string;
}

export type ClientAccountCommand = ClientAccountCreateCommand;

export type ClientAccountUpdateCommand = Partial<Pick<ClientAccountCreateCommand,
  'businessName' | 'commercialName' | 'segment' | 'contactPerson' | 'contactEmail' | 'phone' | 'deliveryProfile' | 'paymentCondition'>>;

export const DEFAULT_CLIENT_ACCOUNT_FILTERS: ClientAccountFilters = {
  q: '',
  status: '',
  buyerMembershipId: '',
  page: 0,
  size: 25,
  sort: 'commercialName',
  direction: 'asc'
};

export interface ClientAccountsState {
  readonly status: ClientAccountLoadStatus;
  readonly page: ClientAccountPage | null;
  readonly item: ClientAccount | null;
  readonly message: string | null;
}
