import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CHANGE_FEED_PORT } from '../../application/change-feed.port';
import { PLATFORM_RUNTIME_CONFIG } from '../../../security/runtime-config';
import { MockChangeFeedClient } from './mock-change-feed.client';
import { changeFeedPortProvider } from './change-feed-port.provider';

describe('platform change-feed adapter provider', () => {
  it('keeps mock mode offline', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_RUNTIME_CONFIG, useValue: { dataMode: 'mock' } },
        changeFeedPortProvider,
      ],
    });

    const port = TestBed.inject(CHANGE_FEED_PORT);
    expect(port).toBeInstanceOf(MockChangeFeedClient);
    expect(() => port.connect()).not.toThrow();
  });
});
