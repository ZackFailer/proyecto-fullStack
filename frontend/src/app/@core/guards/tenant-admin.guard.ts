import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { Auth } from '../services/auth/auth';

/**
 * Guard for admin-only tenant routes (users management).
 * Requirements:
 * - User must be authenticated
 * - User's role must be 'admin' or 'super-admin'
 * - User cannot be 'operator' or 'viewer'
 */
export const tenantAdminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { redirect: state.url } });
    return false;
  }

  // Super-admin should use admin routes, not tenant admin routes
  if (auth.isSuperAdmin()) {
    router.navigate(['/admin/users']);
    return false;
  }

  const user = auth.currentUser();
  const role = user?.role;

  // Only admin can access admin-only routes
  if (role === 'admin') {
    return true;
  }

  // Operator, viewer and other roles are denied
  if (user?.clientId) {
    router.navigate(['/app', user.clientId, 'dashboard']);
    return false;
  }

  router.navigate(['/home']);
  return false;
};