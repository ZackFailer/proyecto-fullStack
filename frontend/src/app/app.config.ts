import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { authInterceptor } from './@core/interceptor/auth-interceptor';
import { authRefreshInterceptor } from './@core/interceptor/auth-refresh.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withInterceptors([authInterceptor, authRefreshInterceptor]),
      withFetch(),
    ),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: Aura
      },
      ripple: true,
    })
  ]
};
