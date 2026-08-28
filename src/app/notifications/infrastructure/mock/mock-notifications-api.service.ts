import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG } from '../../../core/security/runtime-config';
import { PlatformNotification } from '../../domain/notification.models';
import { NotificationsApiPort } from '../../domain/ports/notifications-api.port';
import { MOCK_NOTIFICATION_FIXTURES } from './mock-notifications.fixtures';

/** BC-10 in-memory adapter for the Platform notification center. */
@Injectable({ providedIn: 'root' })
export class MockNotificationsApiService extends NotificationsApiPort {
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);
  private notifications = [...MOCK_NOTIFICATION_FIXTURES[this.config.tenantProfile]];

  list(limit = 40): Observable<readonly PlatformNotification[]> { return of(this.notifications.slice(0, limit)); }
  markRead(id: string): Observable<void> { this.notifications = this.notifications.map((item) => item.id === id ? { ...item, read: true } : item); return of(void 0); }
  markAllRead(): Observable<void> { this.notifications = this.notifications.map((item) => ({ ...item, read: true })); return of(void 0); }
}
