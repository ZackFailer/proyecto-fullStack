import { inject, Injectable, signal } from '@angular/core';
import { IProduct } from '../../../../@core/interfaces/i-product';
import { InventoryApi, IInventoryTransfer, IRelatedProduct, ITransferPreview } from './inventory-api';
import { ToastService } from '../../products/services/toast-service';
import { ProductApi } from '../../products/services/product-list/product-api';

@Injectable({
  providedIn: 'root'
})
export class ProductDetailData {
  private readonly inventoryApi = inject(InventoryApi);
  private readonly productApi = inject(ProductApi);
  private readonly toast = inject(ToastService);

  private readonly _product = signal<IProduct | null>(null);
  private readonly _products = signal<IProduct[]>([]);
  private readonly _relatedProducts = signal<IRelatedProduct[]>([]);
  private readonly _loading = signal(false);
  private readonly _transferring = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _transferPreview = signal<ITransferPreview | null>(null);

  readonly product = this._product.asReadonly();
  readonly products = this._products.asReadonly();
  readonly relatedProducts = this._relatedProducts.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly transferring = this._transferring.asReadonly();
  readonly error = this._error.asReadonly();
  readonly transferPreview = this._transferPreview.asReadonly();

  loadProduct(sku: string, includeRelated: boolean = true): void {
    this._loading.set(true);
    this._error.set(null);

    this.productApi.getProductBySku(sku).subscribe({
      next: (product) => {
        this._product.set(product);
        if (includeRelated && product?.sku) {
          this.loadRelatedProducts(product.sku);
        } else {
          this._relatedProducts.set([]);
          this._loading.set(false);
        }
      },
      error: () => {
        this._error.set('Error al cargar el producto');
        this._loading.set(false);
      },
      complete: () => {},
    });
  }

  loadProducts(): void {
    this.productApi.getProducts().subscribe({
      next: (products) => {
        this._products.set(products || []);
      },
      error: () => {
        this._products.set([]);
      },
      complete: () => {},
    });
  }

  private loadRelatedProducts(sku: string): void {
    this.inventoryApi.getRelatedProducts(sku).subscribe({
      next: (response) => {
        this._relatedProducts.set(response.data || []);
        this._loading.set(false);
      },
      error: () => {
        this._relatedProducts.set([]);
        this._loading.set(false);
      },
      complete: () => {},
    });
  }

  setProduct(product: IProduct | null): void {
    this._product.set(product);
    if (product?.sku) {
      this._relatedProducts.set([]);
      this.loadRelatedProducts(product.sku);
    }
  }

  transferInventory(transfer: IInventoryTransfer): Promise<void> {
    this._transferring.set(true);
    this._error.set(null);

    return new Promise((resolve, reject) => {
      this.inventoryApi.transferInventory(transfer).subscribe({
        next: (response) => {
          this._transferring.set(false);
          if (response.success) {
            const transferred = response.data?.quantityTo ?? transfer.quantity;
            this.toast.showSuccess(
              'Transferencia exitosa',
              `Se transfirieron ${transfer.quantity} origen -> ${transferred} destino al SKU ${transfer.toSKU}`
            );
            resolve();
          } else {
            this._error.set(response.message);
            this.toast.showError('Error en transferencia', response.message);
            reject(new Error(response.message));
          }
        },
        error: (err) => {
          this._transferring.set(false);
          const errorMsg = err.error?.message || 'Error al realizar la transferencia';
          this._error.set(errorMsg);
          this.toast.showError('Error en transferencia', errorMsg);
          reject(err);
        }
      });
    });
  }

  previewTransfer(transfer: IInventoryTransfer): Promise<ITransferPreview> {
    return new Promise((resolve, reject) => {
      this.inventoryApi.previewTransfer(transfer).subscribe({
        next: (response) => {
          this._transferPreview.set(response.data);
          resolve(response.data);
        },
        error: (err) => {
          this._transferPreview.set(null);
          reject(err);
        },
        complete: () => {},
      });
    });
  }

  clearPreview(): void {
    this._transferPreview.set(null);
  }
}