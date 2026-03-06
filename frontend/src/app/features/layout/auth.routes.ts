import { Routes } from "@angular/router";

const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth/pages/layout-auth/layout-auth').then(m => m.default),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('../dashboard/pages/dashboard-admin/dashboard-admin')
      },
      {
        path: 'products',
        loadComponent: () => import('../products/pages/product-list/product-list')
      },
    ],
  },
];

export default authRoutes;
