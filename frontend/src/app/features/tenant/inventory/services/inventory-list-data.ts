import { inject, Injectable, signal } from '@angular/core';
import { ProductApi } from '../../products/services/product-list/product-api';
import { IProduct } from '../../../../@core/interfaces/i-product';

export interface IInventoryProduct extends IProduct {
  displayType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryListData {
  private readonly productApi = inject(ProductApi);

  private readonly _products = signal<IInventoryProduct[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly products = this._products.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  loadProducts(searchTerm: string = '', filters: Record<string, string | null> = {}): void {
    this._loading.set(true);
    this._error.set(null);

    this.productApi.getProducts().subscribe({
      next: (products) => {
        let filtered = products || [];
        
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filtered = filtered.filter(p => 
            p.sku?.toLowerCase().includes(term) ||
            p.name?.toLowerCase().includes(term) ||
            p.ean?.toLowerCase().includes(term)
          );
        }

        if (filters['status']) {
          filtered = filtered.filter(p => p.status === filters['status']);
        }

        this._products.set(filtered);
        this._loading.set(false);
      },
      error: () => {
        this._error.set('Error al cargar el inventario');
        this._loading.set(false);
      },
      complete: () => {},
    });
  }

  clearError(): void {
    this._error.set(null);
  }
}