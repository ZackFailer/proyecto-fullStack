import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IProduct } from '../../../../@core/interfaces/i-product';

export interface IInventoryTransfer {
  fromSKU: string;
  toSKU: string;
  quantity: number;
  reason?: string;
}

export interface ITransferPreview {
  fromSKU: string;
  toSKU: string;
  quantityFrom: number;
  quantityTo: number;
  conversionApplied: boolean;
  conversionPreview?: {
    fromAttribute: string;
    toAttribute: string;
    fromValue: number;
    toValue: number;
  };
}

export interface ITransferResponse {
  success: boolean;
  message: string;
  data?: {
    fromSKU: string;
    toSKU: string;
    quantityFrom: number;
    quantityTo: number;
    conversionApplied: boolean;
    conversionPreview?: {
      fromAttribute: string;
      toAttribute: string;
      fromValue: number;
      toValue: number;
    };
    fromStockAfter: number;
    toStockAfter: number;
    status: string;
  };
}

export interface IRelatedProduct {
  sku: string;
  name: string;
  stock: number;
  type: string;
}

export interface IRelatedProductsResponse {
  success: boolean;
  message: string;
  data: IRelatedProduct[];
}

export interface ITransferListItem {
  id: string;
  fromSKU: string;
  toSKU: string;
  quantityFrom: number;
  quantityTo: number;
  conversionApplied: boolean;
  conversionFactor?: {
    fromAttribute: string;
    toAttribute: string;
    fromValue: number;
    toValue: number;
  };
  status: string;
  reason?: string;
  createdAt: string;
}

export interface ITransfersResponse {
  success: boolean;
  message: string;
  data: {
    items: ITransferListItem[];
    total: number;
    page: number;
    limit: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class InventoryApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/inventory';

  transferInventory(transfer: IInventoryTransfer): Observable<ITransferResponse> {
    return this.http.post<ITransferResponse>(`${this.apiUrl}/transfer`, transfer);
  }

  previewTransfer(transfer: IInventoryTransfer): Observable<{ success: boolean; message: string; data: ITransferPreview }> {
    return this.http.post<{ success: boolean; message: string; data: ITransferPreview }>(`${this.apiUrl}/transfer/preview`, transfer);
  }

  getTransfers(sku?: string): Observable<ITransfersResponse> {
    const params = sku ? `?sku=${encodeURIComponent(sku)}` : '';
    return this.http.get<ITransfersResponse>(`${this.apiUrl}/transfers${params}`);
  }

  getRelatedProducts(sku: string): Observable<IRelatedProductsResponse> {
    return this.http.get<IRelatedProductsResponse>(`/api/products/${sku}/related`);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ProductDetailApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/products';

  getProductBySku(sku: string): Observable<IProduct | null> {
    return this.http.get<{ success: boolean; data: IProduct }>(`${this.apiUrl}/${sku}`).pipe(
      map(response => response.success ? response.data : null)
    );
  }
}
