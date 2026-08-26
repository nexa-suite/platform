/**
 * Composition boundary from transversal Platform security into BC-01 IAM.
 * Other bounded contexts consume this boundary instead of reaching into IAM.
 */
export { AuthenticationService as PlatformAuthenticationBoundary } from '../../tenantaccessgovernance/iam/application/authentication.service';
export type { AuthenticatedUser, InternalRole } from '../../tenantaccessgovernance/iam/domain/models/auth.models';
