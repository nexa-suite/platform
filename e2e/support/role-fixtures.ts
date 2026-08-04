export type CredentialRole = 'OWNER' | 'TENANT_ADMIN' | 'COMPANY_OWNER' | 'SALES' | 'WAREHOUSE' | 'LOGISTICS' | 'BUYER';

export interface RoleFixture {
  readonly expectedRoles: readonly string[];
  readonly expectedPermissions: readonly string[];
  readonly surface: 'PLATFORM' | 'PORTAL';
}

/**
 * Runtime role fixtures mirror the API local bootstrap. Expected permissions
 * are assertions over the session response, never a client-side auth source.
 */
export const ROLE_FIXTURES: Readonly<Record<CredentialRole, RoleFixture>> = {
  OWNER: {
    expectedRoles: ['TENANT_ADMIN', 'COMPANY_OWNER'],
    expectedPermissions: [
      'tenant:read', 'tenant:manage', 'iam:user:read', 'iam:user:manage',
      'owner:dashboard:read', 'sales:read', 'warehouse:read', 'logistics:read', 'fulfillment:read',
      'catalog:read', 'catalog:manage', 'catalog:price:manage', 'promotion:read', 'promotion:manage'
    ],
    surface: 'PLATFORM'
  },
  TENANT_ADMIN: {
    expectedRoles: ['TENANT_ADMIN'],
    expectedPermissions: ['tenant:read', 'tenant:manage', 'iam:user:read', 'iam:user:manage'],
    surface: 'PLATFORM'
  },
  COMPANY_OWNER: {
    expectedRoles: ['COMPANY_OWNER'],
    expectedPermissions: [
      'tenant:read', 'owner:dashboard:read', 'sales:read', 'warehouse:read', 'logistics:read', 'fulfillment:read',
      'catalog:read', 'catalog:manage', 'catalog:price:manage', 'promotion:read', 'promotion:manage'
    ],
    surface: 'PLATFORM'
  },
  SALES: {
    expectedRoles: ['SALES'],
    expectedPermissions: ['catalog:read', 'promotion:read', 'sales:read', 'sales:write'],
    surface: 'PLATFORM'
  },
  WAREHOUSE: {
    expectedRoles: ['WAREHOUSE'],
    expectedPermissions: ['catalog:read', 'warehouse:read', 'warehouse:write', 'fulfillment:read'],
    surface: 'PLATFORM'
  },
  LOGISTICS: {
    expectedRoles: ['LOGISTICS'],
    expectedPermissions: ['catalog:read', 'promotion:read', 'warehouse:read', 'logistics:read', 'logistics:write', 'fulfillment:read'],
    surface: 'PLATFORM'
  },
  BUYER: {
    expectedRoles: ['BUYER'],
    expectedPermissions: ['catalog:read', 'sales:buyer:read', 'sales:buyer:write', 'promotion:read', 'orders:buyer:read', 'tracking:buyer:read'],
    surface: 'PORTAL'
  }
};

const runtimeEnvironment =
  (
    globalThis as typeof globalThis & {
      readonly process?: { readonly env: Record<string, string | undefined> };
    }
  ).process?.env ?? {};

export function credentialEnvironment(role: CredentialRole): { readonly email?: string; readonly password?: string; readonly workspace: string } {
  const prefix = `NEXA_E2E_${role}`;
  const developmentPrefix = `NEXA_DEV_${role}`;
  return {
    email: runtimeEnvironment[`${prefix}_EMAIL`] ?? runtimeEnvironment[`${developmentPrefix}_EMAIL`],
    password: runtimeEnvironment[`${prefix}_PASSWORD`] ?? runtimeEnvironment[`${developmentPrefix}_PASSWORD`],
    workspace: runtimeEnvironment.NEXA_E2E_WORKSPACE ?? runtimeEnvironment.NEXA_DEV_WORKSPACE_SLUG ?? 'icisa'
  };
}
