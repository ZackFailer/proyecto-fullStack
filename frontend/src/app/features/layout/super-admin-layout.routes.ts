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
      {
        path: ':tenantId',
        loadChildren: () => import('./tenant-viewer.routes')
      },
    ],
  },
];

export default SuperAdminLayout;
