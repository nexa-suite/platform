import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { bearerInterceptor } from './core/security/bearer.interceptor';
import { platformRuntimeConfigFactory, PLATFORM_RUNTIME_CONFIG } from './core/security/runtime-config';
import { refreshInterceptor } from './core/security/refresh.interceptor';
import { AuthenticationService } from './iam/application/authentication.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: PLATFORM_RUNTIME_CONFIG, useFactory: platformRuntimeConfigFactory },
    provideHttpClient(withInterceptors([bearerInterceptor, refreshInterceptor])),
    provideRouter(routes, withComponentInputBinding()),
    provideAppInitializer(() => inject(AuthenticationService).restore()),
    provideTranslateService({
      fallbackLang: 'en',
      lang: 'en',
      loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' })
    })
  ]
};
