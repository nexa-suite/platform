import { Injectable, inject } from '@angular/core';
import { CHANGE_FEED_PORT } from './change-feed.port';

/** Application-facing change-feed port for feature contexts. */
@Injectable({ providedIn: 'root' })
export class ChangeFeedService {
  private readonly client = inject(CHANGE_FEED_PORT);
  readonly events = this.client.events;

  connect(): void { this.client.connect(); }
  disconnect(): void { this.client.disconnect(); }
}
