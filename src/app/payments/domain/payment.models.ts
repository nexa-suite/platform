export interface PaymentPage {
  readonly items: readonly PaymentSummary[];
  readonly page: number;
  readonly size: number;
  readonly total: number;
}

export interface PaymentSummary {
  readonly id: string;
  readonly receivableId: string;
  readonly receivableNumber: string;
  readonly clientAccountId: string;
  readonly method: string;
  readonly status: string;
  readonly amount: number;
  readonly currency: string;
  readonly reference: string | null;
  readonly reviewReason: string | null;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

export interface PaymentReviewResult {
  readonly id: string;
  readonly receivableId: string;
  readonly method: string;
  readonly status: string;
  readonly amount: number;
  readonly currency: string;
  readonly createdAt: string;
  readonly completedAt: string | null;
}
