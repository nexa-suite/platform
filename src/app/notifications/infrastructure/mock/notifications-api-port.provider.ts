import { inject, Provider } from '@angular/core';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { NotificationsApiPort } from '../../domain/ports/notifications-api.port';
import { NotificationsApiService } from '../notifications-api.service';
import { MockNotificationsApiService } from './mock-notifications-api.service';

export const notificationsApiPortProvider: Provider = {
  provide: NotificationsApiPort,
  useFactory: () => inject(PLATFORM_RUNTIME_CONFIG).dataMode === 'mock' ? inject(MockNotificationsApiService) : inject(NotificationsApiService),
};
