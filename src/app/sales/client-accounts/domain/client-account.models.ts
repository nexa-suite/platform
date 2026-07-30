export type ClientAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | string;
export type ClientAccountLoadStatus = 'idle' | 'loading' | 'retrying' | 'success' | 'empty' | 'error';

export interface ClientAccount {
  readonly id: string;
  readonly code: string;
  readonly businessName: string;
  readonly commercialName: string;
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

export interface ClientAccountCommand {
  readonly businessName: string;
  readonly commercialName: string;
  readonly segment: string;
  readonly contactPerson: string;
  readonly contactEmail: string;
  readonly phone: string;
  readonly deliveryProfile: string;
  readonly paymentCondition: string;
}

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
