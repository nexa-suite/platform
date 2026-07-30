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
  readonly status: string;
  readonly buyerMembershipId: string | null;
  readonly version: number;
}
export interface ClientAccountPage { readonly items: readonly ClientAccount[]; readonly page: number; readonly size: number; readonly total: number; }
