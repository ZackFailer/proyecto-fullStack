import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class LayoutAdminData {

  items: MenuItem[]  = [
    {
      label: 'Dashboard',
      icon: 'pi pi-fw pi-home',
      routerLink: '/admin/dashboard'
    },
    {
      label: 'Productos',
      icon: 'pi pi-fw pi-box',
      routerLink: '/admin/products'
    },
    {
      label: 'Usuarios',
      icon: 'pi pi-fw pi-users',
      routerLink: '/admin/users'
    },
    {
      label: 'Inventario',
      icon: 'pi pi-fw pi-briefcase',
      routerLink: '/admin/inventory'
    },
    {
      label: 'Carga masiva',
      icon: 'pi pi-fw pi-upload',
      routerLink: '/admin/bulk-upload'
    },
    {
      label: 'Clientes y Proveedores',
      icon: 'pi pi-fw pi-id-card',
      routerLink: '/admin/clients-providers'
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
  ]
  constructor() { }


}
