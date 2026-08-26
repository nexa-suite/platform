/**
 * BC-03 read model for promotion targeting. Customer identity remains an
 * upstream reference; Catalog does not import the Customer Account model.
 */
export interface CatalogPromotionTargetOption {
  readonly id: string;
  readonly code: string;
  readonly businessName: string;
  readonly commercialName: string;
}
