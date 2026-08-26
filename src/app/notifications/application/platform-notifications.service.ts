import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeFeedService } from '../../core/change-feed/application/change-feed.service';
import { PlatformNotification } from '../domain/notification.models';
import { NotificationsApiPort } from '../domain/ports/notifications-api.port';

export type { PlatformNotification } from '../domain/notification.models';

@Injectable({ providedIn: 'root' })
export class PlatformNotificationsService {
  private readonly feed = inject(ChangeFeedService, { optional: true });
  private readonly api = inject(NotificationsApiPort, { optional: true });
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
    if (!this.api) return;
    this.api.list(40).subscribe({
      next: (notifications) => this.notificationsSignal.set(notifications),
      error: () => undefined
    });
  }

  markRead(id: string): void {
    this.notificationsSignal.update((current) => current.map((notification) => notification.id === id ? { ...notification, read: true } : notification));
    this.api?.markRead(id).subscribe({ error: () => undefined });
  }

  markAllRead(): void {
    this.notificationsSignal.update((current) => current.map((notification) => ({ ...notification, read: true })));
    this.api?.markAllRead().subscribe({ error: () => undefined });
  }

  private feedMessage(resourceType: string): string {
    return resourceType ? `Updated ${resourceType}` : 'A workspace event was received';
  }
}
