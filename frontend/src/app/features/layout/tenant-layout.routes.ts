import { Routes } from "@angular/router";
import { tenantPrivilegedGuard } from '../../@core/guards/tenant-privileged.guard';
import { tenantAdminGuard } from '../../@core/guards/tenant-admin.guard';
/**
 * Tenant layout routes under /app/:tenantId/**
 * These routes are for regular tenant users (admin, operator, viewer).
 * Super-admin users should use /admin/** routes instead.
 */
const tenantLayoutRoutes: Routes = [
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
        loadComponent: () => import('../../shared/under-construction/under-construction').then(m => m.UnderConstruction)
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
        path: 'products/import',
        loadComponent: () => import('../tenant/products/pages/bulk-import'),
        canActivate: [tenantAdminGuard]
      },
      {
        path: 'users',
        loadComponent: () => import('../super-admin/users/pages/users/users'),
        canActivate: [tenantAdminGuard]
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
        loadComponent: () => import('../../shared/under-construction/under-construction').then(m => m.UnderConstruction),
        canActivate: [tenantPrivilegedGuard]
      },
      {
        path: 'history',
        loadComponent: () => import('../../shared/under-construction/under-construction').then(m => m.UnderConstruction),
        canActivate: [tenantPrivilegedGuard]
      },
    ],
  },
];
export default tenantLayoutRoutes;
