import { Routes } from '@angular/router';
import { superAdminChildGuard, superAdminGuard } from './@core/guards/super-admin.guard';
import { tenantContextChildGuard, tenantContextGuard } from './@core/guards/tenant-context.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./features/public/home/pages/home')
  },
  {
    path: 'about',
    loadComponent: () => import('./features/public/about/pages/about/about')
  },
  {
    path: 'login',
    loadComponent: () => import('./features/public/login/pages/login/login')
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/layout/auth/pages/layout-auth/layout-auth').then(m => m.default),
    loadChildren: () => import('./features/layout/super-admin-layout.routes'),
    canActivate: [superAdminGuard],
    canActivateChild: [superAdminChildGuard]
  },
  {
    path: 'app/:tenantId',
    loadComponent: () => import('./features/layout/auth/pages/layout-auth/layout-auth').then(m => m.default),
    loadChildren: () => import('./features/layout/tenant-layout.routes'),
    canActivate: [tenantContextGuard],
    canActivateChild: [tenantContextChildGuard]
  },
];
