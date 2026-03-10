import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const reqWithCookies = req.clone({ withCredentials: true });
  return next(reqWithCookies);
};
