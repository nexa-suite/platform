import { Observable } from 'rxjs';
import {
  BuyerMembershipCandidate,
  ClientAccount,
  ClientAccountAddress,
  ClientAccountAddressCommand,
  ClientAccountAddressUpdateCommand,
  ClientAccountCreateCommand,
  ClientAccountFilters,
  ClientAccountPage,
  ClientAccountUpdateCommand,
  PeruReferenceOption
} from '../client-account.models';

/** Customer and buyer relationship port; HTTP stays behind the infrastructure adapter. */
export abstract class CustomerRelationshipsApiPort {
  abstract clientAccounts(filters?: ClientAccountFilters): Observable<ClientAccountPage>;
  abstract clientAccount(id: string): Observable<ClientAccount>;
  abstract buyerMembershipCandidates(): Observable<readonly BuyerMembershipCandidate[]>;
  abstract createClientAccount(command: ClientAccountCreateCommand): Observable<ClientAccount>;
  abstract updateClientAccount(id: string, version: number, command: ClientAccountUpdateCommand): Observable<ClientAccount>;
  abstract changeClientAccountStatus(id: string, version: number, action: 'activations' | 'suspensions'): Observable<ClientAccount>;
  abstract associateBuyer(id: string, version: number, membershipId: string | null): Observable<ClientAccount>;
  abstract clientAccountAddresses(id: string): Observable<readonly ClientAccountAddress[]>;
  abstract createClientAccountAddress(id: string, command: ClientAccountAddressCommand): Observable<ClientAccountAddress>;
  abstract updateClientAccountAddress(id: string, addressId: string, version: number, command: ClientAccountAddressUpdateCommand): Observable<ClientAccountAddress>;
  abstract setDefaultClientAccountAddress(id: string, addressId: string, version: number): Observable<ClientAccountAddress>;
  abstract deactivateClientAccountAddress(id: string, addressId: string, version: number): Observable<ClientAccountAddress>;
  abstract reference(resource: 'departments' | 'provinces' | 'districts' | 'road-types', parentCode?: string): Observable<readonly PeruReferenceOption[]>;
}
