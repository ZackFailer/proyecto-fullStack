import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IProduct } from '../../../../../@core/interfaces/i-product';

@Injectable({
  providedIn: 'root'
})
export class ProductApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/products';

  getProducts(): Observable<IProduct[]> {
    // return this.http.get<IProduct[]>(`${this.apiUrl}`);
    return of([
      { id: 101, img: 'https://fastly.picsum.photos/id/430/5000/3333.jpg?hmac=jTXazuJlbKhKJPePtieNBZJEVzuau4m6KF-Q7A4P0EU', name: 'Laptop Pro 14"', category: 'Tecnologia', price: 1250, stock: 8 },
      { id: 102, img: 'https://fastly.picsum.photos/id/290/4000/3000.jpg?hmac=_ctwO3N2FctxTAnZ60r83EV4KnkD9BjdZ-NnEfPLw0A', name: 'Auriculares Inalambricos', category: 'Audio', price: 180, stock: 43 },
      { id: 103, img: 'https://fastly.picsum.photos/id/37/4928/3264.jpg?hmac=GmoNgM3WMBALnlegIhYGtXvquxyum9TZ9XQnDFIHPiQ', name: 'Cámara Deportiva 4K', category: 'Fotografia', price: 320, stock: 16 },
      { id: 104, img: 'https://fastly.picsum.photos/id/257/5000/3333.jpg?hmac=Pv8YKyVIzVFDCzBKMAzxt2pNGJlFWAfcl30MHg2Qh_w', name: 'Mouse Ergonomico', category: 'Perifericos', price: 65, stock: 120 },
      { id: 105, img: 'https://fastly.picsum.photos/id/102/4326/2884.jpg?hmac=-smbnJdDGVdpqyozsD0km1vz-lIM94mFDEJJEc91F3c', name: 'Smartwatch Active', category: 'Wearables', price: 210, stock: 35 },
      { id: 106, img: 'https://fastly.picsum.photos/id/1080/4000/2667.jpg?hmac=jnrK-qtc7LuY-XKGPKFOEf5M-7RuXyKX0xTUaubJc6U', name: 'Silla Gamer', category: 'Oficina', price: 350, stock: 21 },
      { id: 107, img: 'https://fastly.picsum.photos/id/1065/4000/2667.jpg?hmac=lItL1g4B6_ImopwXt6hm8eieAZfReYmqF_04IRcJB1E', name: 'Router WiFi 6', category: 'Redes', price: 145, stock: 58 },
      { id: 108, img: 'https://fastly.picsum.photos/id/56/3072/2048.jpg?hmac=-DpUygCPdIMHW9e_JTcG94LQ8hWM8948Op9m244yuX4', name: 'Tablet Lite 10"', category: 'Tecnologia', price: 290, stock: 44 },
      { id: 109, img: 'https://fastly.picsum.photos/id/314/4608/3072.jpg?hmac=V4v4Is_CnKym9-eRkSE7WqztFzGF0DQYmdtRqjykbI0', name: 'Parlante Bluetooth', category: 'Audio', price: 75, stock: 87 },
      { id: 110, img: 'https://fastly.picsum.photos/id/292/4896/3264.jpg?hmac=uy53UmGbS4X3szbClft8qQOKgZDRXcFblzJ0KjiUYBc', name: 'Aspiradora Robot', category: 'Hogar', price: 430, stock: 19 },
    ]);
  }
}
