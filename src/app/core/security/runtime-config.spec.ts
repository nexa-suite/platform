import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  PLATFORM_RUNTIME_CONFIG,
  PLATFORM_SURFACE,
  PlatformRuntimeConfig,
  platformRuntimeConfigFactory,
  selectRuntimeAdapter
} from './runtime-config';

type RuntimeGlobalWithConfig = typeof globalThis & {
  __NEXA_RUNTIME_CONFIG__?: Partial<PlatformRuntimeConfig>;
};

const runtimeGlobal = globalThis as RuntimeGlobalWithConfig;

describe('platform runtime configuration', () => {
  let previous: Partial<PlatformRuntimeConfig> | undefined;

  beforeEach(() => {
    previous = runtimeGlobal.__NEXA_RUNTIME_CONFIG__;
    delete runtimeGlobal.__NEXA_RUNTIME_CONFIG__;
  });

  afterEach(() => {
    if (previous === undefined) delete runtimeGlobal.__NEXA_RUNTIME_CONFIG__;
    else runtimeGlobal.__NEXA_RUNTIME_CONFIG__ = previous;
  });

  it('defaults to same-origin API data and the generic tenant profile', () => {
    expect(platformRuntimeConfigFactory()).toEqual({ apiBaseUrl: '', surface: PLATFORM_SURFACE, dataMode: 'api', tenantProfile: 'generic' });
  });

  it('keeps browser runtime API-only even when a global requests mock data', () => {
    runtimeGlobal.__NEXA_RUNTIME_CONFIG__ = { apiBaseUrl: 'https://api.local/', surface: ' PLATFORM ', dataMode: 'mock', tenantProfile: 'icisa' };

    expect(platformRuntimeConfigFactory()).toEqual({ apiBaseUrl: 'https://api.local', surface: 'PLATFORM', dataMode: 'api', tenantProfile: 'icisa' });
  });

  it('keeps only an accepted local demo persona', () => {
    runtimeGlobal.__NEXA_RUNTIME_CONFIG__ = { dataMode: 'mock', tenantProfile: 'icisa', demoRoleProfile: 'warehouse' };
    expect(platformRuntimeConfigFactory().demoRoleProfile).toBe('warehouse');

    runtimeGlobal.__NEXA_RUNTIME_CONFIG__ = { dataMode: 'mock', tenantProfile: 'icisa', demoRoleProfile: 'bom' as never };
    expect(platformRuntimeConfigFactory().demoRoleProfile).toBeUndefined();
  });

  it('normalizes unsupported runtime values back to safe defaults', () => {
    runtimeGlobal.__NEXA_RUNTIME_CONFIG__ = {
      dataMode: 'fixture' as PlatformRuntimeConfig['dataMode'],
      tenantProfile: 'legacy' as PlatformRuntimeConfig['tenantProfile']
    };

    expect(platformRuntimeConfigFactory().dataMode).toBe('api');
    expect(platformRuntimeConfigFactory().tenantProfile).toBe('generic');
  });

  it('selects only the adapter allowed by the resolved data mode', () => {
    const apiAdapter = { name: 'api' };
    const mockAdapter = { name: 'mock' };

    expect(selectRuntimeAdapter({ dataMode: 'api' }, apiAdapter, mockAdapter)).toBe(apiAdapter);
    expect(selectRuntimeAdapter({ dataMode: 'mock' }, apiAdapter, mockAdapter)).toBe(mockAdapter);
  });

  it('keeps the runtime token available for application composition', () => {
    expect(PLATFORM_RUNTIME_CONFIG).toBeDefined();
  });
});
