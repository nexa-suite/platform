import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthenticationService } from '../../iam/application/authentication.service';
import { isAuthenticationRequest } from './auth-request-context';

export const bearerInterceptor: HttpInterceptorFn = (request, next) => {
  const authentication = inject(AuthenticationService);
  const accessToken = authentication.accessToken();

  if (!accessToken || isAuthenticationRequest(request.url)) {
    return next(request);
  }

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }));
};
