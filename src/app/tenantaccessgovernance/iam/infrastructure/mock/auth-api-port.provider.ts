import { inject, Provider } from '@angular/core';
import { PLATFORM_RUNTIME_CONFIG, selectRuntimeAdapter } from '../../../../core/security/runtime-config';
import { AuthApiPort } from '../../domain/ports/auth-api.port';
import { AuthApiService } from '../http/auth-api.service';
import { MockAuthApiService } from './mock-auth-api.service';

export const authApiPortProvider: Provider = {
  provide: AuthApiPort,
  useFactory: () => selectRuntimeAdapter<AuthApiPort>(
    inject(PLATFORM_RUNTIME_CONFIG),
    inject(AuthApiService),
    inject(MockAuthApiService)
  )
};
