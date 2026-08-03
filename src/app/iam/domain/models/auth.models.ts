export const INTERNAL_ROLES = [
  'TENANT_ADMIN',
  'COMPANY_OWNER',
  'SALES',
  'WAREHOUSE',
  'LOGISTICS'
] as const;

export type InternalRole = (typeof INTERNAL_ROLES)[number];

export type AuthStatus =
  | 'unknown'
  | 'restoring'
  | 'anonymous'
  | 'authenticating'
  | 'authenticated'
  | 'forbidden'
  | 'error'
  | 'signingOut';

export interface SignInCommand {
  readonly identifier: string;
  readonly password: string;
  readonly workspaceSlug: string;
}

export interface AuthenticatedUser {
  readonly subject: string;
  readonly identifier: string;
  readonly displayName: string;
  readonly workspaceSlug: string;
  readonly roles: readonly InternalRole[];
  readonly permissions: readonly string[];
  /** Raw role codes are retained so tenant-defined roles are not discarded by the UI. */
  readonly roleCodes?: readonly string[];
  readonly roleDefinitionIds?: readonly string[];
  readonly tenantId?: string;
  readonly tenantSlug?: string;
  readonly workspaceId?: string;
  readonly membershipId?: string;
  readonly authorizationVersion?: number;
}

export interface AuthSession {
  readonly accessToken: string;
  readonly user: AuthenticatedUser;
}

export interface AuthState {
  readonly status: AuthStatus;
  readonly user: AuthenticatedUser | null;
  readonly message: string | null;
}

export const INITIAL_AUTH_STATE: AuthState = {
  status: 'unknown',
  user: null,
  message: null
};

export function isInternalRole(value: string): value is InternalRole {
  return (INTERNAL_ROLES as readonly string[]).includes(value.trim().toUpperCase());
}

export function normalizeInternalRoles(values: readonly string[] | undefined): readonly InternalRole[] {
  const roles = (values ?? [])
    .map((value) => value.trim().toUpperCase().replace(/^ROLE_/, ''))
    .filter(isInternalRole);

  const unique = roles.filter((role, index) => roles.indexOf(role) === index);
  return [...unique].sort((left, right) => INTERNAL_ROLES.indexOf(left) - INTERNAL_ROLES.indexOf(right));
}

export function normalizePermissions(values: readonly string[] | undefined): readonly string[] {
  return [...new Set((values ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean))];
}

export function normalizeRoleCodes(values: readonly string[] | undefined): readonly string[] {
  return [...new Set((values ?? []).map((value) => value.trim().toUpperCase().replace(/^ROLE_/, '')).filter(Boolean))];
}
