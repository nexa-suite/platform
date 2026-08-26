import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CustomerRelationshipsApiPort } from '../../../customerbuyerrelationships/domain/ports/customer-relationships-api.port';
import {
  DEFAULT_SALES_COMMITMENT_CUSTOMER_FILTERS,
  SalesCommitmentAddressCommand,
  SalesCommitmentAddressReference,
  SalesCommitmentCustomerFilters,
  SalesCommitmentCustomerReference,
  SalesCommitmentCustomerReferencePage,
  SalesCommitmentReferenceOption
} from '../../domain/customer-reference.models';
import { SalesCommitmentCustomerPort } from '../../domain/ports/sales-commitment-cross-context.ports';

/**
 * Anti-corruption layer for the BC-02 account/relationship reference used by
 * Sales Commitment. It keeps the upstream Customer models out of this BC.
 */
@Injectable({ providedIn: 'root' })
export class SalesCommitmentCustomerGateway implements SalesCommitmentCustomerPort {
  private readonly customer = inject(CustomerRelationshipsApiPort);

  clientAccounts(filters: SalesCommitmentCustomerFilters = DEFAULT_SALES_COMMITMENT_CUSTOMER_FILTERS): Observable<SalesCommitmentCustomerReferencePage> {
    return this.customer.clientAccounts(filters).pipe(map((page) => ({
      ...page,
      items: page.items.map((account): SalesCommitmentCustomerReference => ({
        id: account.id,
        code: account.code,
        businessName: account.businessName,
        commercialName: account.commercialName,
        taxType: account.taxType,
        taxValue: account.taxValue,
        deliveryProfile: account.deliveryProfile,
        paymentCondition: account.paymentCondition,
        status: account.status
      }))
    })));
  }

  clientAccountAddresses(id: string): Observable<readonly SalesCommitmentAddressReference[]> {
    return this.customer.clientAccountAddresses(id).pipe(map((items) => items.map((address) => this.address(address))));
  }

  createClientAccountAddress(id: string, command: SalesCommitmentAddressCommand): Observable<SalesCommitmentAddressReference> {
    return this.customer.createClientAccountAddress(id, command).pipe(map((address) => this.address(address)));
  }

  reference(resource: 'departments' | 'provinces' | 'districts' | 'road-types', parentCode?: string): Observable<readonly SalesCommitmentReferenceOption[]> {
    return this.customer.reference(resource, parentCode).pipe(map((items) => items.map((item) => ({
      id: item.id,
      code: item.code,
      label: item.label,
      parentCode: item.parentCode,
      active: item.active
    }))));
  }

  private address(address: {
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
  }): SalesCommitmentAddressReference {
    return { ...address };
  }
}
