import { inject, Provider } from '@angular/core';

import { CHANGE_FEED_PORT } from '../../application/change-feed.port';
import { PLATFORM_RUNTIME_CONFIG } from '../../../security/runtime-config';
import { ChangeFeedClient } from '../change-feed.service';
import { MockChangeFeedClient } from './mock-change-feed.client';

/** Selects the real stream only for API mode; mock mode stays fully offline. */
export const changeFeedPortProvider: Provider = {
  provide: CHANGE_FEED_PORT,
  useFactory: () => {
    const config = inject(PLATFORM_RUNTIME_CONFIG);
    return config.dataMode === 'mock' ? inject(MockChangeFeedClient) : inject(ChangeFeedClient);
  },
};
