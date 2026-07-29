import { InjectionToken } from '@angular/core';

export const PLATFORM_SURFACE = 'PLATFORM' as const;

export interface PlatformRuntimeConfig {
  readonly apiBaseUrl: string;
  readonly surface: string;
}

export const PLATFORM_RUNTIME_CONFIG = new InjectionToken<PlatformRuntimeConfig>('PLATFORM_RUNTIME_CONFIG');

interface RuntimeGlobal {
  __NEXA_RUNTIME_CONFIG__?: Partial<PlatformRuntimeConfig>;
}

export function platformRuntimeConfigFactory(): PlatformRuntimeConfig {
  const configured = (globalThis as typeof globalThis & RuntimeGlobal).__NEXA_RUNTIME_CONFIG__;
  const apiBaseUrl = configured?.apiBaseUrl?.trim() || 'http://localhost:8080';

  return {
    apiBaseUrl: apiBaseUrl.replace(/\/$/, ''),
    surface: configured?.surface?.trim() || PLATFORM_SURFACE
  };
}

export function platformApiUrl(config: PlatformRuntimeConfig, path: string): string {
  return `${config.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function platformMediaUrl(config: PlatformRuntimeConfig, path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith('/') ? path : `/${path}`;
}
