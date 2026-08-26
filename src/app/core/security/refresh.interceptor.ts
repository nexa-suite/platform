import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { PlatformAuthenticationBoundary } from './platform-authentication.boundary';
import { isAuthenticationRequest, AUTH_REFRESH_RETRY } from './auth-request-context';
import { TokenRefreshCoordinator } from './token-refresh-coordinator';

export const refreshInterceptor: HttpInterceptorFn = (request, next) => {
  const authentication = inject(PlatformAuthenticationBoundary);
  const refreshCoordinator = inject(TokenRefreshCoordinator);

  if (isAuthenticationRequest(request.url) || request.context.get(AUTH_REFRESH_RETRY)) {
    return next(request);
  }

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !authentication.hasAccessToken()) {
        return throwError(() => error);
      }

      return refreshCoordinator.refresh().pipe(
        switchMap((accessToken) => next(request.clone({
          setHeaders: { Authorization: `Bearer ${accessToken}` },
          context: request.context.set(AUTH_REFRESH_RETRY, true)
        }))),
        catchError((refreshError: unknown) => {
          authentication.expireSession();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
