import { computed, inject, Injectable, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { TenantContext } from '../../../../@core/services/tenant/tenant-context';
import { Auth } from '../../../../@core/services/auth/auth';

@Injectable({
  providedIn: 'root'
})
export class LayoutAdminData {
  private readonly tenantContext = inject(TenantContext);
  private readonly auth = inject(Auth);

  private readonly tenantId = this.tenantContext.activeTenantId;
  private readonly tenantInfo = this.tenantContext.tenantInfo;

  readonly itemSidebar = computed<MenuItem[]>(() => {

    if (this.tenantId() && this.auth.isSuperAdmin()) {
      return this.superAdminTenantViewSidebar();
    }

    if (this.auth.isSuperAdmin()) {
      return this.superAdminSidebar();
    }

    if (this.tenantId()) {
      return this.tenantSidebar();
    }

    return [];
  });

  readonly isTenantView = computed(() => Boolean(this.tenantId() && this.auth.isSuperAdmin()));

  readonly tenantViewLabel = computed(() => {
    if (!this.isTenantView()) {
      return null;
    }

    const info = this.tenantInfo();
    const id = this.tenantId();
    if (!id) {
      return null;
    }

    return {
      id,
      name: info?.name ?? `Tenant ${id.slice(-6)}`,
    };
  });

  private readonly superAdminTenantViewSidebar = computed<MenuItem[]>(() => {
    return [
      {
        label: 'Dashboard',
        icon: 'pi pi-fw pi-home',
        routerLink: `/admin/${this.tenantId()}/dashboard`
      },
      {
        label: 'Productos',
        icon: 'pi pi-fw pi-box',
        items: [
          { label: 'Listado', icon: 'pi pi-list', routerLink: `/admin/${this.tenantId()}/products` },
          { label: 'Product Settings', icon: 'pi pi-cog', routerLink: `/admin/${this.tenantId()}/product-settings` },
        ]
      },
      {
        label: 'Usuarios',
        icon: 'pi pi-fw pi-users',
        routerLink: `/admin/${this.tenantId()}/users`
      },
      {
        label: 'Inventario',
        icon: 'pi pi-fw pi-briefcase',
        routerLink: `/admin/${this.tenantId()}/inventory`
      },
      {
        label: 'Clientes',
        icon: 'pi pi-fw pi-id-card',
        routerLink: `/admin/${this.tenantId()}/customers`
      },
      {
        label: 'Proveedores',
        icon: 'pi pi-fw pi-id-card',
        routerLink: `/admin/${this.tenantId()}/providers`
      },
      {
        label: 'Auditoría y Conciliaciones',
        icon: 'pi pi-fw pi-shield',
        routerLink: `/admin/${this.tenantId()}/audit`
      },
      {
        label: 'Historial',
        icon: 'pi pi-fw pi-clock',
        routerLink: `/admin/${this.tenantId()}/history`
      }
    ];
  });

  private readonly superAdminSidebar = signal<MenuItem[]>([
    {
      label: 'Dashboard',
      icon: 'pi pi-fw pi-home',
      routerLink: '/admin/dashboard'
    },
    {
      label: 'Tenants',
      icon: 'pi pi-fw pi-building',
      routerLink: '/admin/tenants'
    },
    {
      label: 'Usuarios',
      icon: 'pi pi-fw pi-users',
      routerLink: '/admin/users'
    },
    {
      label: 'Auditoría y Conciliaciones',
      icon: 'pi pi-fw pi-shield',
      routerLink: '/admin/audit'
    },
    {
      label: 'Historial',
      icon: 'pi pi-fw pi-clock',
      routerLink: '/admin/history'
    }
  ])

  private readonly tenantSidebar = computed<MenuItem[]>(() => {

    return [
    {
      label: 'Dashboard',
      icon: 'pi pi-fw pi-home',
      routerLink: `/app/${this.tenantId()}/dashboard`
    },
    {
      label: 'Productos',
      icon: 'pi pi-fw pi-box',
      items: [
        { label: 'Listado', icon: 'pi pi-list', routerLink: `/app/${this.tenantId()}/products` },
        { label: 'Product Settings', icon: 'pi pi-cog', routerLink: `/app/${this.tenantId()}/product-settings` },
      ]
    },
    {
      label: 'Usuarios',
      icon: 'pi pi-fw pi-users',
      routerLink: `/app/${this.tenantId()}/users`
    },
    {
      label: 'Inventario',
      icon: 'pi pi-fw pi-briefcase',
      routerLink: `/app/${this.tenantId()}/inventory`
    },
    {
      label: 'Clientes',
      icon: 'pi pi-fw pi-id-card',
      routerLink: `/app/${this.tenantId()}/customers`
    },
    {
      label: 'Proveedores',
      icon: 'pi pi-fw pi-id-card',
      routerLink: `/app/${this.tenantId()}/providers`
    },
    {
      label: 'Auditoría y Conciliaciones',
      icon: 'pi pi-fw pi-shield',
      routerLink: `/app/${this.tenantId()}/audit`
    },
    {
      label: 'Historial',
      icon: 'pi pi-fw pi-clock',
      routerLink: `/app/${this.tenantId()}/history`
    }
  ]});

}
