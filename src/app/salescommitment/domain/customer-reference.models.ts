export interface SalesCommitmentCustomerReference {
  readonly id: string;
  readonly code: string;
  readonly businessName: string;
  readonly commercialName: string;
  /** Optional detail fields populated by the ACL for rich Sales selectors. */
  readonly countryCode?: string;
  readonly taxType: string;
  readonly taxValue: string;
  readonly segment?: string;
  readonly contactPerson?: string;
  readonly contactEmail?: string;
  readonly phone?: string;
  readonly deliveryProfile: string;
  readonly paymentCondition: string;
  readonly status: string;
}

export interface SalesCommitmentCustomerReferencePage {
  readonly items: readonly SalesCommitmentCustomerReference[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly sort: { readonly field: string; readonly direction: 'asc' | 'desc' };
}

export interface SalesCommitmentCustomerFilters {
  readonly q: string;
  readonly status: string;
  readonly buyerMembershipId: string;
  readonly page: number;
  readonly size: number;
  readonly sort: 'code' | 'businessName' | 'commercialName' | 'status' | 'createdAt';
  readonly direction: 'asc' | 'desc';
}

export const DEFAULT_SALES_COMMITMENT_CUSTOMER_FILTERS: SalesCommitmentCustomerFilters = {
  q: '',
  status: '',
  buyerMembershipId: '',
  page: 0,
  size: 25,
  sort: 'commercialName',
  direction: 'asc'
};

export interface SalesCommitmentAddressReference {
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

export interface SalesCommitmentDeliveryAddressCommand {
  readonly addressType: string;
  readonly line: string;
  readonly reference: string;
  readonly countryCode: 'PE';
  readonly departmentCode: string;
  readonly provinceCode: string;
  readonly districtCode: string;
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

export interface SalesCommitmentAddressCommand {
  readonly label: string;
  readonly address: SalesCommitmentDeliveryAddressCommand;
  readonly defaultAddress?: boolean;
}

export interface SalesCommitmentReferenceOption {
  readonly id: number;
  readonly code: string;
  readonly label: string;
  readonly parentCode: string | null;
  readonly active: boolean;
}
