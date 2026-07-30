import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { AuthenticationService } from '../../iam/application/authentication.service';
import { bearerInterceptor } from './bearer.interceptor';

describe('bearerInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([bearerInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthenticationService, useValue: { accessToken: () => 'access-token' } }
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adds a bearer token to protected calls and skips login', () => {
    http.get('/api/v1/catalog-items').subscribe();
    const catalog = httpMock.expectOne('/api/v1/catalog-items');
    expect(catalog.request.headers.get('Authorization')).toBe('Bearer access-token');
    catalog.flush({});

    http.post('/api/v1/authentication/sign-in', {}).subscribe();
    const login = httpMock.expectOne('/api/v1/authentication/sign-in');
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush({});
  });
});
