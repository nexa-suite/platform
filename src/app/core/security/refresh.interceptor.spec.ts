import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Subject } from 'rxjs';
import { AuthenticationService } from '../../iam/application/authentication.service';
import { refreshInterceptor } from './refresh.interceptor';

describe('refreshInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let refresh$: Subject<string>;
  const authentication = {
    hasAccessToken: () => true,
    refreshAccessToken: vi.fn(() => refresh$),
    expireSession: vi.fn()
  };

  beforeEach(() => {
    refresh$ = new Subject<string>();
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([refreshInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthenticationService, useValue: authentication }
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('shares one refresh request for concurrent unauthorized calls', () => {
    const firstResult = vi.fn();
    const secondResult = vi.fn();
    http.get('/api/first').subscribe({ next: firstResult });
    http.get('/api/second').subscribe({ next: secondResult });
    const initial = httpMock.match((request) => request.url.startsWith('/api/'));
    expect(initial).toHaveLength(2);
    initial[0].flush(null, { status: 401, statusText: 'Unauthorized' });
    initial[1].flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authentication.refreshAccessToken).toHaveBeenCalledTimes(1);
    refresh$.next('new-access-token');
    refresh$.complete();

    const retries = httpMock.match((request) => request.url.startsWith('/api/'));
    expect(retries).toHaveLength(2);
    expect(retries[0].request.headers.get('Authorization')).toBe('Bearer new-access-token');
    retries.forEach((request) => request.flush({ ok: true }));
    expect(firstResult).toHaveBeenCalledWith({ ok: true });
    expect(secondResult).toHaveBeenCalledWith({ ok: true });
  });
});
