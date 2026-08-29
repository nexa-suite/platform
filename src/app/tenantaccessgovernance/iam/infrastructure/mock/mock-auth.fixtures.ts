import { PLATFORM_PERMISSIONS } from '../../../../core/security/platform-permissions';
import { PlatformDemoRoleProfile, PlatformTenantProfile } from '../../../../core/security/runtime-config';
import { AuthSession, AuthenticatedUser, InternalRole, TwoFactorChallenge, WorkspacePreview } from '../../domain/models/auth.models';

/**
 * Deterministic demo identities for the first executable Platform slice.
 * These values are never sent to the API and are not production credentials.
 */
export interface MockAuthFixture {
  readonly identifier: string;
  readonly password: string;
  readonly workspaceSlug: string;
  readonly workspacePreview: WorkspacePreview;
  readonly twoFactorCode: string;
  readonly twoFactorChallenge: TwoFactorChallenge;
  readonly session: AuthSession;
}

interface DemoRoleDefinition {
  readonly role: InternalRole;
  readonly permissions: readonly string[];
}

/**
 * Local personas mirror only the internal roles and permission codes already
 * accepted by the API/UI contract. `dispatch` is the visual alias for the
 * backend's existing LOGISTICS role; BOM intentionally has no fixture.
 */
const DEMO_ROLE_DEFINITIONS: Readonly<Record<PlatformDemoRoleProfile, DemoRoleDefinition>> = {
  sales: {
    role: 'SALES',
    permissions: [
      PLATFORM_PERMISSIONS.catalogRead,
      PLATFORM_PERMISSIONS.salesRead,
      PLATFORM_PERMISSIONS.salesWrite,
      'orders:read',
      'orders:write',
      PLATFORM_PERMISSIONS.documentRead,
      PLATFORM_PERMISSIONS.documentGenerate,
      PLATFORM_PERMISSIONS.documentUpload,
      PLATFORM_PERMISSIONS.documentDownload,
    ],
  },
  warehouse: {
    role: 'WAREHOUSE',
    permissions: [
      PLATFORM_PERMISSIONS.catalogRead,
      PLATFORM_PERMISSIONS.warehouseRead,
      PLATFORM_PERMISSIONS.warehouseWrite,
    ],
  },
  dispatch: {
    role: 'LOGISTICS',
    permissions: [
      PLATFORM_PERMISSIONS.logisticsRead,
      PLATFORM_PERMISSIONS.logisticsWrite,
      PLATFORM_PERMISSIONS.documentRead,
      PLATFORM_PERMISSIONS.documentGenerate,
      PLATFORM_PERMISSIONS.documentUpload,
      PLATFORM_PERMISSIONS.documentDownload,
    ],
  },
  'company-owner': {
    role: 'COMPANY_OWNER',
    permissions: [
      PLATFORM_PERMISSIONS.ownerDashboardRead,
      PLATFORM_PERMISSIONS.catalogRead,
      PLATFORM_PERMISSIONS.salesRead,
      PLATFORM_PERMISSIONS.warehouseRead,
      PLATFORM_PERMISSIONS.logisticsRead,
      PLATFORM_PERMISSIONS.documentRead,
    ],
  },
  'tenant-admin': {
    role: 'TENANT_ADMIN',
    permissions: [
      PLATFORM_PERMISSIONS.tenantRead,
      PLATFORM_PERMISSIONS.tenantManage,
      PLATFORM_PERMISSIONS.iamUserRead,
      PLATFORM_PERMISSIONS.iamUserManage,
    ],
  },
};

function session(
  profile: PlatformTenantProfile,
  demoRoleProfile: PlatformDemoRoleProfile,
  identifier: string,
  displayName: string,
): AuthSession {
  const definition = DEMO_ROLE_DEFINITIONS[demoRoleProfile];
  const tokenSuffix = demoRoleProfile === 'sales' ? '' : `-${demoRoleProfile}`;
  const user: AuthenticatedUser = {
    subject: `mock-${profile}-${demoRoleProfile}-operator`,
    identifier,
    displayName,
    workspaceSlug: profile,
    roles: [definition.role],
    permissions: definition.permissions,
    roleCodes: [definition.role],
    tenantId: `mock-${profile}-tenant`,
    tenantSlug: profile,
    workspaceId: `mock-${profile}-workspace`,
    membershipId: `mock-${profile}-membership`,
    authorizationVersion: 1
  };

  return {
    accessToken: `mock-${profile}${tokenSuffix}-access-token`,
    user
  };
}

function fixture(profile: PlatformTenantProfile, demoRoleProfile: PlatformDemoRoleProfile): MockAuthFixture {
  const icisa = profile === 'icisa';
  const domain = icisa ? 'icisa.pe' : 'generic.nexa.test';
  const identifier = demoRoleProfile === 'sales'
    ? (icisa ? 'carlos@icisa.pe' : 'demo@generic.nexa.test')
    : `${demoRoleProfile}@${domain}`;
  const tenantName = icisa ? 'ICISA' : 'Generic';
  const displayName = {
    sales: icisa ? 'Carlos ICISA' : 'Generic Demo Operator',
    warehouse: `Warehouse ${tenantName}`,
    dispatch: `Dispatch ${tenantName}`,
    'company-owner': `Company Owner ${tenantName}`,
    'tenant-admin': `Tenant Admin ${tenantName}`,
  }[demoRoleProfile];
  const challengeSuffix = demoRoleProfile === 'sales' ? '' : `-${demoRoleProfile}`;

  return {
    identifier,
    password: 'NexaDemo123!',
    workspaceSlug: profile,
    workspacePreview: {
      recognized: true,
      displayName: icisa ? 'ICISA Workspace' : 'Generic Workspace',
      workspaceUrl: icisa ? 'icisa.nexa.com.pe' : 'generic.nexa.test',
      logoUrl: '/assets/branding/nexa.svg',
      loginAvailable: true,
    },
    twoFactorCode: '135790',
    twoFactorChallenge: {
      challengeId: `mock-${profile}${challengeSuffix}-platform-two-factor-challenge`,
      channel: 'authenticator',
      maskedDestination: 'authenticator app',
      expiresInSeconds: 300,
    },
    session: session(profile, demoRoleProfile, identifier, displayName),
  };
}

export const MOCK_AUTH_ROLE_FIXTURES: Readonly<Record<
  PlatformTenantProfile,
  Readonly<Record<PlatformDemoRoleProfile, MockAuthFixture>>
>> = {
  generic: {
    sales: fixture('generic', 'sales'),
    warehouse: fixture('generic', 'warehouse'),
    dispatch: fixture('generic', 'dispatch'),
    'company-owner': fixture('generic', 'company-owner'),
    'tenant-admin': fixture('generic', 'tenant-admin'),
  },
  icisa: {
    sales: fixture('icisa', 'sales'),
    warehouse: fixture('icisa', 'warehouse'),
    dispatch: fixture('icisa', 'dispatch'),
    'company-owner': fixture('icisa', 'company-owner'),
    'tenant-admin': fixture('icisa', 'tenant-admin'),
  },
};

/** Backwards-compatible default persona used when no local role is selected. */
export const MOCK_AUTH_FIXTURES: Readonly<Record<PlatformTenantProfile, MockAuthFixture>> = {
  generic: MOCK_AUTH_ROLE_FIXTURES.generic.sales,
  icisa: MOCK_AUTH_ROLE_FIXTURES.icisa.sales,
};
