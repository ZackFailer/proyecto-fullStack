import { inject } from '@angular/core';
import type { CanActivateChildFn } from '@angular/router';
import { Router } from '@angular/router';
import { Auth } from '../services/auth/auth';

export const authGuard: CanActivateChildFn = (_childRoute, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { redirect: state.url } });
  return false;
};
