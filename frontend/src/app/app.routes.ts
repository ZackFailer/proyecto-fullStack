import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/pages/home').then(m => m.default)
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/pages/about/about')
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/pages/login/login')
  },
];
