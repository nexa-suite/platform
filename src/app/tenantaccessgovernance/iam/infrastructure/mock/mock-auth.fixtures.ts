import { PlatformTenantProfile } from '../../../../core/security/runtime-config';
import { AuthSession, AuthenticatedUser, TwoFactorChallenge, WorkspacePreview } from '../../domain/models/auth.models';

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

const DEMO_PERMISSIONS = [
  'catalog:read',
  'sales:read',
  'sales:write',
  'orders:read',
  'orders:write',
  'document.read',
  'document.generate',
  'document.upload',
  'document.download',
] as const;

const DEMO_ROLES = ['SALES'] as const;

function session(
  profile: PlatformTenantProfile,
  identifier: string,
  displayName: string,
): AuthSession {
  const user: AuthenticatedUser = {
    subject: `mock-${profile}-operator`,
    identifier,
    displayName,
    workspaceSlug: profile,
    roles: DEMO_ROLES,
    permissions: DEMO_PERMISSIONS,
    roleCodes: DEMO_ROLES,
    tenantId: `mock-${profile}-tenant`,
    tenantSlug: profile,
    workspaceId: `mock-${profile}-workspace`,
    membershipId: `mock-${profile}-membership`,
    authorizationVersion: 1
  };

  return {
    accessToken: `mock-${profile}-access-token`,
    user
  };
}

export const MOCK_AUTH_FIXTURES: Readonly<Record<PlatformTenantProfile, MockAuthFixture>> = {
  generic: {
    identifier: 'demo@generic.nexa.test',
    password: 'NexaDemo123!',
    workspaceSlug: 'generic',
    workspacePreview: {
      recognized: true,
      displayName: 'Generic Workspace',
      workspaceUrl: 'generic.nexa.test',
      logoUrl: '/assets/branding/nexa.svg',
      loginAvailable: true
    },
    twoFactorCode: '135790',
    twoFactorChallenge: {
      challengeId: 'mock-generic-platform-two-factor-challenge',
      channel: 'authenticator',
      maskedDestination: 'authenticator app',
      expiresInSeconds: 300
    },
    session: session('generic', 'demo@generic.nexa.test', 'Generic Demo Operator')
  },
  icisa: {
    identifier: 'carlos@icisa.pe',
    password: 'NexaDemo123!',
    workspaceSlug: 'icisa',
    workspacePreview: {
      recognized: true,
      displayName: 'ICISA Workspace',
      workspaceUrl: 'icisa.nexa.com.pe',
      logoUrl: '/assets/branding/nexa.svg',
      loginAvailable: true
    },
    twoFactorCode: '135790',
    twoFactorChallenge: {
      challengeId: 'mock-icisa-platform-two-factor-challenge',
      channel: 'authenticator',
      maskedDestination: 'authenticator app',
      expiresInSeconds: 300
    },
    session: session('icisa', 'carlos@icisa.pe', 'Carlos ICISA')
  }
};
