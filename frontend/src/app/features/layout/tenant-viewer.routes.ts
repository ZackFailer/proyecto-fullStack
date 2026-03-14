import { Routes } from "@angular/router";

const tenantRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('../super-admin/dashboard/pages/dashboard-admin/dashboard-admin')
      },
      {
        path: 'tenants',
        loadComponent: () => import('../super-admin/tenants/pages/tenants/tenants')
      },
      {
        path: 'products',
        loadComponent: () => import('../tenant/products/pages/product-list')
      },
      {
        path: 'product-settings',
        loadComponent: () => import('../tenant/products/pages/product-settings')
      },
      {
        path: 'users',
        loadComponent: () => import('../super-admin/users/pages/users/users')
      },
      {
        path: 'inventory',
        loadComponent: () => import('../tenant/inventory/pages/inventory/inventory')
      },
      {
        path: 'customers',
        loadComponent: () => import('../tenant/customer/pages/customer/customer')
      },
      {
        path: 'providers',
        loadComponent: () => import('../tenant/provider/pages/provider/provider')
      },
      {
        path: 'audit',
        loadComponent: () => import('../super-admin/audit/pages/audit/audit')
      },
      {
        path: 'history',
        loadComponent: () => import('../super-admin/history/pages/history/history')
      },
    ],
  },
];

export default tenantRoutes;
