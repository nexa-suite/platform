import { Injectable } from '@angular/core';
import { EMPTY } from 'rxjs';

import { ChangeFeedPort } from '../../application/change-feed.port';

/** No-op adapter used by the local mock runtime; it never opens an HTTP stream. */
@Injectable({ providedIn: 'root' })
export class MockChangeFeedClient implements ChangeFeedPort {
  readonly events = EMPTY;

  connect(): void {}

  disconnect(): void {}
}
