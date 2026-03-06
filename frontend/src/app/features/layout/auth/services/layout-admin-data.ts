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
    }
  ]
  constructor() { }


}
