import { Injectable, inject } from '@angular/core';
import { ChangeFeedClient } from '../infrastructure/change-feed.service';

/** Application-facing change-feed port for feature contexts. */
@Injectable({ providedIn: 'root' })
export class ChangeFeedService {
  private readonly client = inject(ChangeFeedClient);
  readonly events = this.client.events;

  connect(): void { this.client.connect(); }
  disconnect(): void { this.client.disconnect(); }
}
