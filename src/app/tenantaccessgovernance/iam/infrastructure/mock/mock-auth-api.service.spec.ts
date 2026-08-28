import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { PLATFORM_RUNTIME_CONFIG } from '../../../../core/security/runtime-config';
import { MockAuthApiService } from './mock-auth-api.service';

describe('MockAuthApiService', () => {
  afterEach(() => {
    sessionStorage.removeItem('nexa.platform.mock.session.active');
    TestBed.resetTestingModule();
  });

  it('keeps the deterministic generic demo identity behind the second-factor challenge', async () => {
    const service = configure('generic');

    const challenge = await firstValueFrom(service.login({
      identifier: 'demo@generic.nexa.test',
      password: 'NexaDemo123!',
      workspaceSlug: 'generic'
    }));
    expect(challenge).toMatchObject({ twoFactorRequired: true });
    const session = await firstValueFrom(service.verifyTwoFactor('mock-generic-platform-two-factor-challenge', '135790'));

    expect(session.accessToken).toBe('mock-generic-access-token');
    expect(session.user.workspaceSlug).toBe('generic');
    expect(session.user.permissions).toContain('sales:write');
  });

  it('keeps the ICISA scenario explicit and rejects another workspace', async () => {
    const service = configure('icisa');

    const challenge = await firstValueFrom(service.login({
      identifier: 'carlos@icisa.pe',
      password: 'NexaDemo123!',
      workspaceSlug: 'icisa'
    }));
    expect(challenge).toMatchObject({ twoFactorRequired: true });
    const session = await firstValueFrom(service.verifyTwoFactor('mock-icisa-platform-two-factor-challenge', '135790'));

    expect(session.user.displayName).toBe('Carlos ICISA');
    await expect(firstValueFrom(service.login({
      identifier: 'carlos@icisa.pe',
      password: 'NexaDemo123!',
      workspaceSlug: 'generic'
    }))).rejects.toThrow('MOCK_AUTHENTICATION_FAILED');
  });

  it('does not create a session during mock bootstrap', async () => {
    const service = configure('icisa');
    await expect(firstValueFrom(service.refresh())).rejects.toThrow('MOCK_SESSION_NOT_FOUND');
  });

  function configure(tenantProfile: 'generic' | 'icisa'): MockAuthApiService {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { apiBaseUrl: '', surface: 'PLATFORM', dataMode: 'mock', tenantProfile } },
        MockAuthApiService
      ]
    });
    return TestBed.inject(MockAuthApiService);
  }
});
