import { Routes } from "@angular/router";

const SuperAdminLayout: Routes = [
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
        path: 'config',
        loadComponent: () => import('../super-admin/users/pages/users/users')
      },
      {
        path: 'users',
        loadComponent: () => import('../super-admin/users/pages/users/users')
      },
      {
        path: 'audit',
        loadComponent: () => import('../super-admin/audit/pages/audit/audit')
      },
      {
        path: 'history',
        loadComponent: () => import('../super-admin/history/pages/history/history')
      },
      // Tenant-scoped routes (when super-admin is viewing a specific tenant)
      {
        path: ':tenantId',
        children: [
          {
            path: 'users',
            loadComponent: () => import('../super-admin/users/pages/users/users')
          },
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
            path: 'products',
            loadComponent: () => import('../tenant/products/pages/product-list')
          },
          {
            path: 'product-settings',
            loadComponent: () => import('../tenant/products/pages/product-settings')
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
        ]
      },
    ],
  },
];

export default SuperAdminLayout;
