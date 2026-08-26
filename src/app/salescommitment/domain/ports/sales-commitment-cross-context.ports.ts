import { Observable } from 'rxjs';
import { SalesCommitmentCatalogPage } from '../sales-commitment-catalog.models';
import {
  DEFAULT_SALES_COMMITMENT_CUSTOMER_FILTERS,
  SalesCommitmentAddressCommand,
  SalesCommitmentAddressReference,
  SalesCommitmentCustomerFilters,
  SalesCommitmentCustomerReferencePage,
  SalesCommitmentReferenceOption
} from '../customer-reference.models';

/** ACL from Sales Commitment to the Catalog context. */
export abstract class SalesCommitmentCatalogPort {
  abstract search(query?: string): Observable<SalesCommitmentCatalogPage>;
}

/** ACL from Sales Commitment to Customer & Buyer Relationships. */
export abstract class SalesCommitmentCustomerPort {
  abstract clientAccounts(filters?: SalesCommitmentCustomerFilters): Observable<SalesCommitmentCustomerReferencePage>;
  abstract clientAccountAddresses(id: string): Observable<readonly SalesCommitmentAddressReference[]>;
  abstract createClientAccountAddress(id: string, command: SalesCommitmentAddressCommand): Observable<SalesCommitmentAddressReference>;
  abstract reference(resource: 'departments' | 'provinces' | 'districts' | 'road-types', parentCode?: string): Observable<readonly SalesCommitmentReferenceOption[]>;
}
