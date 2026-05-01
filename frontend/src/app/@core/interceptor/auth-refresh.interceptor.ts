import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { Auth } from '../services/auth/auth';
import { AuthApi } from '../services/auth/auth-api';
import { Router } from '@angular/router';
import { TenantContext } from '../services/tenant/tenant-context';

/**
 * Paths excluded from the refresh interceptor.
 * These endpoints should not trigger token refresh attempts.
 */
const EXCLUDED_PATHS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout'
];

/**
 * Subject used to unblock queued requests while refresh is in-flight.
 * - `null`: refresh in progress
 * - `true`: refresh succeeded
 * - `false`: refresh failed
 */
const refreshSubject = new BehaviorSubject<boolean | null>(true);
let isRefreshing = false;

function isExcludedPath(url: string): boolean {
  return EXCLUDED_PATHS.some(path => url.includes(path));
}

export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip excluded paths - don't intercept these
  if (isExcludedPath(req.url)) {
    return next(req);
  }

  const authApi = inject(AuthApi);
  const auth = inject(Auth);
  const tenantContext = inject(TenantContext);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle 401 errors (expired/invalid auth)
      if (error.status === 401) {
        // If already refreshing, queue the request until refresh resolves
        if (isRefreshing) {
          return refreshSubject.pipe(
            filter((result): result is boolean => result !== null),
            take(1),
            switchMap((success) => {
              if (success) {
                return next(req);
              }

              return throwError(() => error);
            })
          );
        }

        // Start refresh process
        isRefreshing = true;
        refreshSubject.next(null);

        return authApi.refresh().pipe(
          switchMap((response) => {
            if (response.success && response.data?.user) {
              // Refresh succeeded
              isRefreshing = false;
              refreshSubject.next(true);
              // Update user with new token data
              auth.updateUser(response.data.user);
              // Retry the original request
              return next(req);
            }

            // Refresh returned failure - clear session
            isRefreshing = false;
            refreshSubject.next(false);
            auth.clearSession();
            tenantContext.clear();
            router.navigate(['/login']);
            return throwError(() => error);
          }),
          catchError((refreshError) => {
            // Refresh failed - clear session and redirect
            isRefreshing = false;
            refreshSubject.next(false);
            auth.clearSession();
            tenantContext.clear();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }

      // Re-throw non-auth errors
      return throwError(() => error);
    })
  );
};
