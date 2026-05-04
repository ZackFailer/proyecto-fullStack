import { inject } from '@angular/core';
import type { CanActivateChildFn, CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { Auth } from '../services/auth/auth';
import { TenantContext } from '../services/tenant/tenant-context';

/**
 * Guard for tenant routes under /app/:tenantId/**
 * Requirements:
 * - User must NOT be super-admin
 * - User's clientId must match the :tenantId parameter
 */
const evaluateTenantContext = (tenantId: string | undefined, redirectUrl: string): boolean => {
  const auth = inject(Auth);
  const router = inject(Router);
  const tenantContext = inject(TenantContext);

  if (!tenantId) {
    router.navigate(['/home']);
    return false;
  }

  // Must be authenticated
  if (!auth.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { redirect: redirectUrl } });
    return false;
  }

  // Super-admin users cannot access tenant routes
  if (auth.isSuperAdmin()) {
    router.navigate(['/admin/dashboard']);
    return false;
  }

  // User's clientId must match the tenantId
  const user = auth.currentUser();
  if (user?.clientId !== tenantId) {
    // Redirect to user's own tenant if available
    if (user?.clientId) {
      router.navigate(['/app', user.clientId, 'dashboard']);
      return false;
    }
    router.navigate(['/home']);
    return false;
  }

  // Set the tenant context
  tenantContext.setActiveTenantId(tenantId);

  return true;
};

export const tenantContextGuard: CanActivateFn = (route, state) =>
  evaluateTenantContext(route.paramMap.get('tenantId') ?? undefined, state.url);

export const tenantContextChildGuard: CanActivateChildFn = (route, state) =>
  evaluateTenantContext(route.paramMap.get('tenantId') ?? undefined, state.url);
