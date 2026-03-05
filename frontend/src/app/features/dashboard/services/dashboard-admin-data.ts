import { Injectable, signal } from '@angular/core';
import { IShortCardDashboard } from '../../../@core/interfaces/i-short-card-dashboard';

@Injectable({
  providedIn: 'root'
})
export class DashboardAdminData {

  constructor() { }

  public readonly shortCardData = signal<IShortCardDashboard[]>([{
    title: 'Total Sales',
    value: '$25,000',
    colorDescription: 'text-green-500',
    description: 'Up from last month',
    description2: '15%',
    icon: 'pi pi-chart-line',
    iconBackground: 'bg-green-100',
    colorIcon: '#22c55e'
    },
    {
      title: 'New Customers',
      value: '1,200',
      colorDescription: 'text-red-500',
      description: 'Down from last month',
      description2: '5%',
      icon: 'pi pi-users',
      iconBackground: 'bg-red-100',
      colorIcon: '#ef4444'
    },
    {
      title: 'Orders',
      value: '3,500',
      colorDescription: 'text-blue-500',
      description: 'Up from last month',
      description2: '10%',
      icon: 'pi pi-shopping-cart',
      iconBackground: 'bg-blue-100',
      colorIcon: '#3b82f6'
    },
    {
      title: 'Revenue',
      value: '$50,000',
      colorDescription: 'text-yellow-500',
      description: 'Up from last month',
      description2: '20%',
      icon: 'pi pi-dollar-sign',
      iconBackground: 'bg-yellow-100',
      colorIcon: '#f59e00'
    }
  ]);

}
