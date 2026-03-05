import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IShortCardDashboard } from '../../../@core/interfaces/i-short-card-dashboard';
import { ITableConfig } from '../../../shared/single-table/single-table';
import { IProduct } from './dashboard-admin-data';

@Injectable({
  providedIn: 'root'
})
export class DashboardAdminApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/dashboard';
  
  getShortCardData():Observable<IShortCardDashboard[]> {
    // return this.http.get(`${this.apiUrl}/short-card-data`);
    return of([
      {
        title: 'Ventas Totales',
        value: '$25,000',
        colorDescription: 'text-green-500',
        description: 'Crecimiento mensual',
        description2: '15%',
        icon: 'pi pi-chart-line',
        iconBackground: 'bg-green-100',
        colorIcon: '#22c55e'
      },
      {
        title: 'Nuevos Clientes',
        value: '1,200',
        colorDescription: 'text-red-500',
        description: 'Decrecimiento mensual',
        description2: '5%',
        icon: 'pi pi-users',
        iconBackground: 'bg-red-100',
        colorIcon: '#ef4444'
      },
      {
        title: 'Ordenes',
        value: '3,500',
        colorDescription: 'text-blue-500',
        description: 'Crecimiento mensual',
        description2: '10%',
        icon: 'pi pi-shopping-cart',
        iconBackground: 'bg-blue-100',
        colorIcon: '#3b82f6'
      },
      {
        title: 'Ganancias',
        value: '$50,000',
        colorDescription: 'text-yellow-500',
        description: 'Crecimiento mensual',
        description2: '20%',
        icon: 'pi pi-dollar',
        iconBackground: 'bg-yellow-100',
        colorIcon: '#f59e00'
      }
    ]);
  }
  getProductsDashboard():Observable<IProduct[]> {
    // return this.http.get(`${this.apiUrl}/table-data`);
    return of([
      { img: 'https://fastly.picsum.photos/id/40/4106/2806.jpg?hmac=MY3ra98ut044LaWPEKwZowgydHZ_rZZUuOHrc3mL5mI', name: 'Product 1', price: 100 },
      { img: 'https://fastly.picsum.photos/id/40/4106/2806.jpg?hmac=MY3ra98ut044LaWPEKwZowgydHZ_rZZUuOHrc3mL5mI', name: 'Product 2', price: 200 },
      { img: 'https://fastly.picsum.photos/id/40/4106/2806.jpg?hmac=MY3ra98ut044LaWPEKwZowgydHZ_rZZUuOHrc3mL5mI', name: 'Product 3', price: 300 },
      { img: 'https://fastly.picsum.photos/id/40/4106/2806.jpg?hmac=MY3ra98ut044LaWPEKwZowgydHZ_rZZUuOHrc3mL5mI', name: 'Product 4', price: 100 },
      { img: 'https://fastly.picsum.photos/id/40/4106/2806.jpg?hmac=MY3ra98ut044LaWPEKwZowgydHZ_rZZUuOHrc3mL5mI', name: 'Product 5', price: 200 },
      { img: 'https://fastly.picsum.photos/id/40/4106/2806.jpg?hmac=MY3ra98ut044LaWPEKwZowgydHZ_rZZUuOHrc3mL5mI', name: 'Product 6', price: 300 },
      { img: 'https://fastly.picsum.photos/id/40/4106/2806.jpg?hmac=MY3ra98ut044LaWPEKwZowgydHZ_rZZUuOHrc3mL5mI', name: 'Product 7', price: 100 },
      { img: 'https://fastly.picsum.photos/id/40/4106/2806.jpg?hmac=MY3ra98ut044LaWPEKwZowgydHZ_rZZUuOHrc3mL5mI', name: 'Product 8', price: 200 },
      { img: 'https://fastly.picsum.photos/id/40/4106/2806.jpg?hmac=MY3ra98ut044LaWPEKwZowgydHZ_rZZUuOHrc3mL5mI', name: 'Product 9', price: 300 },
      { img: 'https://fastly.picsum.photos/id/40/4106/2806.jpg?hmac=MY3ra98ut044LaWPEKwZowgydHZ_rZZUuOHrc3mL5mI', name: 'Product 10', price: 100 },
      { img: 'https://fastly.picsum.photos/id/40/4106/2806.jpg?hmac=MY3ra98ut044LaWPEKwZowgydHZ_rZZUuOHrc3mL5mI', name: 'Product 11', price: 200 },
      { img: 'https://fastly.picsum.photos/id/40/4106/2806.jpg?hmac=MY3ra98ut044LaWPEKwZowgydHZ_rZZUuOHrc3mL5mI', name: 'Product 12', price: 300 },
    ])
  }

  getChartData() {
    // return this.http.get(`${this.apiUrl}/chart-data`);
    return of({
      data: {
        labels: ['Enero', 'Febrero', 'Marzo'],
        datasets: [
          {
            label: 'Ventas de Productos',
            data: [540, 325, 702],
            backgroundColor: ['#42A5F5', '#42A5F5', '#42A5F5']
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  constructor() { }

}
