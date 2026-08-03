import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeFeedService } from '../change-feed/infrastructure/change-feed.service';
import { platformApiUrl, PLATFORM_RUNTIME_CONFIG } from '../security/runtime-config';

export interface PlatformNotification {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly message: string;
  readonly deepLink: string | null;
  readonly subjectType: string | null;
  readonly createdAt: string;
  readonly read: boolean;
}

interface NotificationPageResponse {
  readonly items?: readonly NotificationResponse[];
  readonly unreadCount?: number;
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
export class PlatformNotificationsService {
  private readonly feed = inject(ChangeFeedService, { optional: true });
  private readonly http = inject(HttpClient, { optional: true });
  private readonly config = inject(PLATFORM_RUNTIME_CONFIG, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationsSignal = signal<readonly PlatformNotification[]>([]);
  readonly notifications = this.notificationsSignal.asReadonly();
  readonly unreadCount = computed(() => this.notifications().filter((notification) => !notification.read).length);

  constructor() {
    this.feed?.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      this.notificationsSignal.update((current) => [
        {
          id: event.id,
          category: event.eventType,
          title: event.eventType,
          message: this.feedMessage(event.resourceType),
          deepLink: null,
          subjectType: event.resourceType || null,
          createdAt: event.occurredAt,
          read: false
        },
        ...current.filter((notification) => notification.id !== event.id)
      ].slice(0, 40));
    });
    this.load();
  }

  load(): void {
    if (!this.http || !this.config) return;
    const params = new HttpParams().set('limit', 40);
    this.http.get<NotificationPageResponse>(platformApiUrl(this.config, '/api/v1/notifications'), { params }).subscribe({
      next: (page) => this.notificationsSignal.set((page.items ?? []).map((item) => this.toNotification(item))),
      error: () => undefined
    });
  }

  markRead(id: string): void {
    this.notificationsSignal.update((current) => current.map((notification) => notification.id === id ? { ...notification, read: true } : notification));
    if (this.http && this.config) {
      this.http.post<void>(platformApiUrl(this.config, `/api/v1/notifications/${encodeURIComponent(id)}/read`), null).subscribe({ error: () => undefined });
    }
  }

  markAllRead(): void {
    this.notificationsSignal.update((current) => current.map((notification) => ({ ...notification, read: true })));
    if (this.http && this.config) {
      this.http.post<void>(platformApiUrl(this.config, '/api/v1/notifications/read-all'), null).subscribe({ error: () => undefined });
    }
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

  private feedMessage(resourceType: string): string {
    return resourceType ? `Updated ${resourceType}` : 'A workspace event was received';
  }
}
