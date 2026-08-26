export interface SalesCommitmentCatalogItem {
  readonly id: string;
  readonly productFamilyName: string;
  readonly skuCode: string | null;
  readonly name: string;
  readonly presentation: string;
  readonly image: { readonly url: string | null; readonly fileName: string | null };
  readonly brand: string;
  readonly category: string;
  readonly unitOfMeasure: string | null;
  readonly packagingType: string | null;
  readonly netWeight: number | null;
  readonly grossWeight: number | null;
  readonly unitPrice: { readonly amount: number; readonly currency: string };
  readonly availabilityStatus: string;
}

export interface SalesCommitmentCatalogPage {
  readonly items: readonly SalesCommitmentCatalogItem[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly totalPages: number;
}
