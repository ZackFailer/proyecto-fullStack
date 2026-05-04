import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IProduct } from '../../../../../@core/interfaces/i-product';

export interface ProductsResponse {
  success: boolean;
  message: string;
  data: IProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProductApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/products';

  getProducts(): Observable<IProduct[]> {
    return this.http.get<ProductsResponse>(`${this.apiUrl}`).pipe(
      map(response => response.data || [])
    );
  }

  getProductById(id: string): Observable<IProduct | null> {
    return this.http.get<{ success: boolean; data: IProduct }>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.success ? response.data : null)
    );
  }

  getProductBySku(sku: string): Observable<IProduct | null> {
    return this.http.get<{ success: boolean; data: IProduct }>(`${this.apiUrl}/sku/${sku}`).pipe(
      map(response => response.success ? response.data : null)
    );
  }

  createProduct(product: Partial<IProduct>): Observable<IProduct> {
    return this.http.post<{ success: boolean; data: IProduct }>(`${this.apiUrl}`, product).pipe(
      map(response => response.data)
    );
  }

  updateProduct(id: string, product: Partial<IProduct>): Observable<IProduct> {
    return this.http.put<{ success: boolean; data: IProduct }>(`${this.apiUrl}/${id}`, product).pipe(
      map(response => response.data)
    );
  }

  updateProductBySku(sku: string, product: Partial<IProduct>): Observable<IProduct> {
    return this.http.put<{ success: boolean; data: IProduct }>(`${this.apiUrl}/sku/${sku}`, product).pipe(
      map(response => response.data)
    );
  }
}