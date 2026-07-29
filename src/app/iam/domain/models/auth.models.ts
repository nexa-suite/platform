export const INTERNAL_ROLES = [
  'OWNER',
  'ADMIN',
  'SALES',
  'INVENTORY',
  'WAREHOUSE',
  'LOGISTICS',
  'DISPATCH'
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

  return roles.filter((role, index) => roles.indexOf(role) === index);
}
