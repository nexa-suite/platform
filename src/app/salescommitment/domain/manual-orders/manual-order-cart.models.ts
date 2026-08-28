/** Client-side catalog selection owned by the manual Sales Order workflow. */
export interface ManualOrderCartItem {
  readonly catalogItemId: string;
  readonly skuId: string | null;
  readonly productFamilyName: string;
  readonly name: string;
  readonly presentation: string;
  readonly unit: string;
  readonly quantity: number;
  readonly unitPriceAmount: number | null;
  readonly currency: string;
  readonly imageUrl: string | null;
  readonly availabilityStatus: string;
  readonly notes: string;
}
