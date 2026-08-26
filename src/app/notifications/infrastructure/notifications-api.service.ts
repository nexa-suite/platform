import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PLATFORM_RUNTIME_CONFIG, platformApiUrl } from '../../core/security/runtime-config';
import { PlatformNotification } from '../domain/notification.models';
import { NotificationsApiPort } from '../domain/ports/notifications-api.port';

interface NotificationPageResponse {
  readonly items?: readonly NotificationResponse[];
}

interface NotificationResponse {
  readonly id: string;
  readonly category?: string;
  readonly title?: string;
  readonly message?: string;
  readonly deepLink?: string | null;
  readonly subjectType?: string | null;
  readonly createdAt?: string;
  readonly readAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class NotificationsApiService implements NotificationsApiPort {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG);

  list(limit = 40): Observable<readonly PlatformNotification[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<NotificationPageResponse>(platformApiUrl(this.config, '/api/v1/notifications'), { params }).pipe(
      map((page) => (page.items ?? []).map((item) => this.toNotification(item)))
    );
  }

  markRead(id: string): Observable<void> {
    return this.http.post<void>(platformApiUrl(this.config, `/api/v1/notifications/${encodeURIComponent(id)}/read`), null);
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(platformApiUrl(this.config, '/api/v1/notifications/read-all'), null);
  }

  private toNotification(item: NotificationResponse): PlatformNotification {
    return {
      id: item.id,
      category: item.category ?? 'notification',
      title: item.title ?? 'Notification',
      message: item.message ?? '',
      deepLink: item.deepLink ?? null,
      subjectType: item.subjectType ?? null,
      createdAt: item.createdAt ?? '',
      read: Boolean(item.readAt)
    };
  }
}
