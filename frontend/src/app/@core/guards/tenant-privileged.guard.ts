import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { Auth } from '../services/auth/auth';

/**
 * Guard for privileged tenant routes (audit, history).
 * Requirements:
 * - User must be authenticated
 * - User's role must be 'admin' or 'operator'
 * - User cannot be 'viewer' or 'super-admin'
 */
export const tenantPrivilegedGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { redirect: state.url } });
    return false;
  }

  // Super-admin should use admin routes, not tenant privileged routes
  if (auth.isSuperAdmin()) {
    router.navigate(['/admin/audit']);
    return false;
  }

  const user = auth.currentUser();
  const role = user?.role;

  // Only admin and operator can access privileged routes
  if (role === 'admin' || role === 'operator') {
    return true;
  }

  // Viewer and other roles are denied
  if (user?.clientId) {
    router.navigate(['/app', user.clientId, 'dashboard']);
    return false;
  }

  router.navigate(['/home']);
  return false;
};