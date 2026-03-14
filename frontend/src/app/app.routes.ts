import { Routes } from '@angular/router';

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
    canActivateChild: [() => import('./@core/guards/auth-guard')]
  },
  {
    path: 'app/:tenantId',
    loadChildren: () => import('./features/layout/super-admin-layout.routes'),
    canActivate: [() => import('./@core/guards/auth-guard')]
  },
];
