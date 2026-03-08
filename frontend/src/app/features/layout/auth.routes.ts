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
      {
        path: 'users',
        loadComponent: () => import('../users/pages/users/users')
      },
      {
        path: 'inventory',
        loadComponent: () => import('../inventory/pages/inventory/inventory')
      },
      {
        path: 'bulk-upload',
        loadComponent: () => import('../bulk-upload/pages/bulk-upload/bulk-upload')
      },
      {
        path: 'clients-providers',
        loadComponent: () => import('../clients-providers/pages/clients-providers/clients-providers')
      },
      {
        path: 'audit',
        loadComponent: () => import('../audit/pages/audit/audit')
      },
      {
        path: 'history',
        loadComponent: () => import('../history/pages/history/history')
      },
    ],
  },
];

export default authRoutes;
