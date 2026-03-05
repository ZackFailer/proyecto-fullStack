import { computed, Injectable, signal } from '@angular/core';
import { IShortCardDashboard } from '../../../@core/interfaces/i-short-card-dashboard';
import { ITableConfig } from '../../../shared/single-table/single-table';

export interface ITableColumn {
  field: string;
  header: string;
}

export interface Product {
  img: string;
  name: string;
  price: number;
}

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

  private readonly cols = signal<ITableColumn[]>([
    { field: 'img', header: 'Imagen' },
    { field: 'name', header: 'Nombre' },
    { field: 'price', header: 'Precio' },
  ]);

  private readonly products = signal<Product[]>([
    { img: 'path/to/image1.jpg', name: 'Product 1', price: 100 },
    { img: 'path/to/image2.jpg', name: 'Product 2', price: 200 },
    { img: 'path/to/image3.jpg', name: 'Product 3', price: 300 },
    { img: 'path/to/image4.jpg', name: 'Product 4', price: 100 },
    { img: 'path/to/image5.jpg', name: 'Product 5', price: 200 },
    { img: 'path/to/image6.jpg', name: 'Product 6', price: 300 },
    { img: 'path/to/image7.jpg', name: 'Product 7', price: 100 },
    { img: 'path/to/image8.jpg', name: 'Product 8', price: 200 },
    { img: 'path/to/image9.jpg', name: 'Product 9', price: 300 },
    { img: 'path/to/image10.jpg', name: 'Product 10', price: 100 },
    { img: 'path/to/image11.jpg', name: 'Product 11', price: 200 },
    { img: 'path/to/image12.jpg', name: 'Product 12', price: 300 },
  ]);

  public tableConfig = computed<ITableConfig<Product>>(() => ({
    item: this.products(),
    columns: this.cols(),
    showActions: true,
    paginator: true,
    rows: 5
  }));


}
