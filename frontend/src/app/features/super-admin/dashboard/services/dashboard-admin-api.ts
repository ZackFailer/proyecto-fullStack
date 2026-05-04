import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IShortCardDashboard } from '../../../../@core/interfaces/i-short-card-dashboard';
import { IProduct } from '../../../../@core/interfaces/i-product';

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
      { id: 1,  img: 'https://fastly.picsum.photos/id/40/4106/2806.jpg?hmac=MY3ra98ut044LaWPEKwZowgydHZ_rZZUuOHrc3mL5mI', name: 'Auriculares Pro',        category: 'Electronica', price: 120, stock: 34 },
      { id: 2,  img: 'https://fastly.picsum.photos/id/43/5184/3456.jpg?hmac=pQFyFZkPAzsyvWSd3b-qlFW4Qi5VslixdtISeY-kpyA', name: 'Cafetera Express',     category: 'Hogar',        price: 260, stock: 12 },
      { id: 3,  img: 'https://fastly.picsum.photos/id/29/4000/2670.jpg?hmac=2UHzlGXYhs6Vd3yo6KpajEfR5V1p3VunSJpP8oFysVk', name: 'Monitor 27"',          category: 'Tecnologia',   price: 320, stock: 18 },
      { id: 4,  img: 'https://fastly.picsum.photos/id/82/1500/997.jpg?hmac=Tk1YhknaDs4-zV1Ib39hZEVmw8VmjMk7P22A8O7k-hM', name: 'Silla Ergonomica',     category: 'Oficina',      price: 180, stock: 27 },
      { id: 5,  img: 'https://fastly.picsum.photos/id/54/3264/2176.jpg?hmac=ONND4QcXCeh8alAeRkzPCWVvS9XzXGf7l7NtfL0g7fE', name: 'Laptop Ultrabook',     category: 'Tecnologia',   price: 980, stock: 6  },
      { id: 6,  img: 'https://fastly.picsum.photos/id/60/3000/2000.jpg?hmac=onlsf_G0Rif3j-68f3KRt0sNDwREmw5QY9mqMtJh1ks', name: 'Teclado Mecanico',    category: 'Perifericos',  price: 140, stock: 55 },
      { id: 7,  img: 'https://fastly.picsum.photos/id/155/3264/2176.jpg?hmac=p0FYC21ASWIlNm3y7jGBVqh42OgMhjHb_hfXqF19SO4', name: 'Cámara Mirrorless',   category: 'Fotografia',   price: 750, stock: 9  },
      { id: 8,  img: 'https://fastly.picsum.photos/id/250/5000/3333.jpg?hmac=BsbaJBSyLW_IWnGX0UzSdYIjHo4n4PIIvKfe230vfJU', name: 'Bicicleta Urbana',    category: 'Deportes',     price: 680, stock: 14 },
      { id: 9,  img: 'https://fastly.picsum.photos/id/292/4896/3264.jpg?hmac=uy53UmGbS4X3szbClft8qQOKgZDRXcFblzJ0KjiUYBc', name: 'Robot Aspirador',     category: 'Hogar',        price: 410, stock: 22 },
      { id: 10, img: 'https://fastly.picsum.photos/id/378/4000/2670.jpg?hmac=PEuquY16w8uwrUp9HkQs6hzb1Dy2qsBSXDtCHe3kfrk', name: 'Smartwatch Series 9', category: 'Wearables',    price: 290, stock: 48 },
      { id: 11, img: 'https://fastly.picsum.photos/id/447/3264/2448.jpg?hmac=t76pV2iWjq9p-6k59Rvbd6KPGCrsze6lOErQJ2tFQqU', name: 'Parlante Portatil',   category: 'Audio',        price: 95,  stock: 61 },
      { id: 12, img: 'https://fastly.picsum.photos/id/466/3333/2500.jpg?hmac=3W7AVJIHLLsTek19DD_-dWmLHbRBkC3JVRSXyrVqycQ', name: 'Tablet 11"',          category: 'Tecnologia',   price: 370, stock: 25 },
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
