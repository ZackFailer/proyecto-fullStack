import { inject } from '@angular/core';
import type { CanActivateChildFn, CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { Auth } from '../services/auth/auth';

/**
 * Guard for super-admin routes.
 * Only allows access to users with role 'super-admin'.
 */
const evaluateSuperAdmin = (redirectUrl: string): boolean => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.isSuperAdmin()) {
    return true;
  }

  if (!auth.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { redirect: redirectUrl } });
    return false;
  }

  // Authenticated but not super-admin - redirect to tenant app if available
  const user = auth.currentUser();
  if (user?.clientId) {
    router.navigate(['/app', user.clientId, 'dashboard']);
    return false;
  }

  router.navigate(['/home']);
  return false;
};

export const superAdminGuard: CanActivateFn = (_route, state) => evaluateSuperAdmin(state.url);

export const superAdminChildGuard: CanActivateChildFn = (_route, state) => evaluateSuperAdmin(state.url);
