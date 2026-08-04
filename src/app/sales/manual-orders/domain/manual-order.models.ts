export type ManualOrderDraftStatus = 'DRAFT' | 'CLIENT_COMPLETE' | 'ITEMS_COMPLETE' | 'DELIVERY_COMPLETE' | 'READY_TO_CREATE' | 'CREATED' | 'ABANDONED';

export interface ManualOrderClient {
  readonly id: string;
  readonly code: string;
  readonly businessName: string;
  readonly commercialName: string;
  readonly taxIdentifierType: string;
  readonly taxIdentifierValue: string;
  readonly status: string;
  readonly paymentTerms: string;
  readonly creditLimit: number;
  readonly currentExposure: number;
  readonly availableCredit: number;
}

export interface ManualOrderLine {
  readonly id: string;
  readonly skuId: string;
  readonly catalogItemId: string;
  readonly productFamily: string;
  readonly familyCode: string;
  readonly skuCode: string;
  readonly presentation: string;
  readonly unit: string;
  readonly quantity: number;
  readonly baseUnitPrice: number;
  readonly effectiveUnitPrice: number;
  readonly discountAmount: number;
  readonly currency: string;
  readonly availabilityStatus: string;
  readonly notes: string | null;
}

export interface ManualOrderDelivery {
  readonly addressId: string | null;
  readonly addressSnapshot: string | null;
  readonly routeSnapshot: string | null;
  readonly warehouseSnapshot: string | null;
  readonly warehouseId: string | null;
  readonly routeProvider: string | null;
  readonly deliveryNotes: string | null;
}

export interface ManualOrderDraft {
  readonly id: string;
  readonly status: ManualOrderDraftStatus;
  readonly version: number;
  readonly client: ManualOrderClient | null;
  readonly requestedDeliveryDate: string | null;
  readonly priority: string;
  readonly paymentPreference: string | null;
  readonly currency: string;
  readonly notes: string | null;
  readonly creditResult: string | null;
  readonly lines: readonly ManualOrderLine[];
  readonly delivery: ManualOrderDelivery | null;
  readonly readyToCreate: boolean;
  readonly salesOrderId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly submittedAt: string | null;
}

export interface ManualOrderReview {
  readonly draft: ManualOrderDraft;
  readonly clientComplete: boolean;
  readonly itemsComplete: boolean;
  readonly deliveryComplete: boolean;
  readonly readyToCreate: boolean;
  readonly missing: readonly string[];
}

export interface ManualOrderClientCommand {
  readonly clientAccountId: string;
  readonly requestedDeliveryDate: string;
  readonly priority: string;
  readonly paymentPreference: string;
  readonly currency: string;
  readonly notes: string | null;
}

export interface ManualOrderLineCommand {
  readonly skuId?: string | null;
  readonly catalogItemId?: string | null;
  readonly quantity: number;
  readonly unit: string;
  readonly notes: string | null;
}

export interface ManualOrderDeliveryCommand {
  readonly addressId: string;
  readonly deliveryNotes: string | null;
  readonly routeProvider: string | null;
}
