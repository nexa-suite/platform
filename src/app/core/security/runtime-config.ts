import { InjectionToken } from '@angular/core';

export const PLATFORM_SURFACE = 'PLATFORM' as const;

export type PlatformDataMode = 'api' | 'mock';
export type PlatformTenantProfile = 'generic' | 'icisa';
/** Local-only persona selector for deterministic visual and flow validation. */
export type PlatformDemoRoleProfile = 'sales' | 'warehouse' | 'dispatch' | 'company-owner' | 'tenant-admin';

const PLATFORM_DEMO_ROLE_PROFILES: readonly PlatformDemoRoleProfile[] = [
  'sales',
  'warehouse',
  'dispatch',
  'company-owner',
  'tenant-admin',
];

export interface PlatformRuntimeConfig {
  readonly apiBaseUrl: string;
  readonly surface: string;
  readonly dataMode: PlatformDataMode;
  readonly tenantProfile: PlatformTenantProfile;
  /** Ignored by API authentication; only consumed by the explicit mock adapter. */
  readonly demoRoleProfile?: PlatformDemoRoleProfile;
}

export const PLATFORM_RUNTIME_CONFIG = new InjectionToken<PlatformRuntimeConfig>('PLATFORM_RUNTIME_CONFIG');
const LOCAL_RUNTIME_STORAGE_KEY = 'nexa.platform.local-runtime';

interface RuntimeGlobal {
  __NEXA_RUNTIME_CONFIG__?: Partial<PlatformRuntimeConfig>;
}

function localQueryRuntimeConfig(): Partial<PlatformRuntimeConfig> {
  const location = globalThis.location;
  if (!location || !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return {};
  const params = new URLSearchParams(location.search);
  const stored = readLocalRuntimeConfig();
  const hasExplicitOverride = params.has('nexaDataMode') || params.has('nexaTenantProfile') || params.has('nexaDemoRole');
  const demoRoleProfile = params.has('nexaDemoRole')
    ? normalizeDemoRoleProfile(params.get('nexaDemoRole'))
    : stored?.demoRoleProfile;
  const resolved = {
    dataMode: params.has('nexaDataMode')
      ? params.get('nexaDataMode') === 'mock' ? 'mock' : 'api'
      : stored?.dataMode ?? 'api',
    tenantProfile: params.has('nexaTenantProfile')
      ? params.get('nexaTenantProfile') === 'icisa' ? 'icisa' : 'generic'
      : stored?.tenantProfile ?? 'generic',
    ...(demoRoleProfile ? { demoRoleProfile } : {}),
  } as const;
  if (hasExplicitOverride) writeLocalRuntimeConfig(resolved);
  return resolved;
}

function normalizeDemoRoleProfile(value: unknown): PlatformDemoRoleProfile | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase() as PlatformDemoRoleProfile;
  return PLATFORM_DEMO_ROLE_PROFILES.includes(normalized) ? normalized : undefined;
}

function readLocalRuntimeConfig(): Pick<PlatformRuntimeConfig, 'dataMode' | 'tenantProfile' | 'demoRoleProfile'> | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(LOCAL_RUNTIME_STORAGE_KEY) ?? 'null');
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;
    const demoRoleProfile = normalizeDemoRoleProfile(record['demoRoleProfile']);
    return {
      dataMode: record['dataMode'] === 'mock' ? 'mock' : 'api',
      tenantProfile: record['tenantProfile'] === 'icisa' ? 'icisa' : 'generic',
      ...(demoRoleProfile ? { demoRoleProfile } : {}),
    };
  } catch {
    return null;
  }
}

function writeLocalRuntimeConfig(value: Pick<PlatformRuntimeConfig, 'dataMode' | 'tenantProfile' | 'demoRoleProfile'>): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(LOCAL_RUNTIME_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Browser storage can be unavailable in privacy-restricted contexts.
  }
}

export function platformRuntimeConfigFactory(): PlatformRuntimeConfig {
  const configured = {
    ...localQueryRuntimeConfig(),
    ...((globalThis as typeof globalThis & RuntimeGlobal).__NEXA_RUNTIME_CONFIG__ ?? {})
  };
  // Keep API calls same-origin when the SPA is served behind its Nginx proxy.
  // An explicit absolute runtime value remains available for isolated local
  // development and test harnesses.
  const apiBaseUrl = configured?.apiBaseUrl?.trim() ?? '';
  const demoRoleProfile = normalizeDemoRoleProfile(configured?.demoRoleProfile);

  return {
    apiBaseUrl: apiBaseUrl.replace(/\/$/, ''),
    surface: configured?.surface?.trim() || PLATFORM_SURFACE,
    dataMode: configured?.dataMode === 'mock' ? 'mock' : 'api',
    tenantProfile: configured?.tenantProfile === 'icisa' ? 'icisa' : 'generic',
    ...(demoRoleProfile ? { demoRoleProfile } : {}),
  };
}

export function selectRuntimeAdapter<T>(config: Pick<PlatformRuntimeConfig, 'dataMode'>, apiAdapter: T, mockAdapter: T): T {
  return config.dataMode === 'mock' ? mockAdapter : apiAdapter;
}

export function platformApiUrl(config: PlatformRuntimeConfig, path: string): string {
  return `${config.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function platformMediaUrl(config: PlatformRuntimeConfig, path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith('/') ? path : `/${path}`;
}
