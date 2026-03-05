import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/pages/home')
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/pages/about/about')
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/pages/login/login')
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/layout/auth.routes')
  },
];
