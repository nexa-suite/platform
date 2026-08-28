import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

import type { ChangeEvent } from '../domain/change-feed.models';

/** Application boundary for the platform change-feed capability. */
export interface ChangeFeedPort {
  readonly events: Observable<ChangeEvent>;
  connect(): void;
  disconnect(): void;
}

export const CHANGE_FEED_PORT = new InjectionToken<ChangeFeedPort>('CHANGE_FEED_PORT');
