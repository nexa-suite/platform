import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface AuthLifecycleEvent {
  readonly type: 'logout';
}

const CHANNEL_NAME = 'nexa-platform-auth-lifecycle';

/** Broadcasts non-sensitive authentication lifecycle events between Platform tabs. */
@Injectable({ providedIn: 'root' })
export class AuthLifecycleChannel {
  private readonly eventsSubject = new Subject<AuthLifecycleEvent>();
  private readonly channel: BroadcastChannel | null;

  readonly events: Observable<AuthLifecycleEvent> = this.eventsSubject.asObservable();

  constructor() {
    if (typeof BroadcastChannel === 'undefined') {
      this.channel = null;
      return;
    }

    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.addEventListener('message', (event: MessageEvent<unknown>) => {
      if (isLogoutEvent(event.data)) this.eventsSubject.next({ type: 'logout' });
    });
  }

  broadcastLogout(): void {
    const event: AuthLifecycleEvent = { type: 'logout' };
    this.channel?.postMessage(event);
  }
}

function isLogoutEvent(value: unknown): value is AuthLifecycleEvent {
  return value !== null
    && typeof value === 'object'
    && (value as { readonly type?: unknown }).type === 'logout';
}
