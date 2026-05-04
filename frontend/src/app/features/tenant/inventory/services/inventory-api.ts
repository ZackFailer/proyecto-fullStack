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
  source?: {
    type: 'manual' | 'rollback';
    originalTransferId?: string;
  };
  status: string;
  reason?: string;
  createdAt: string;
}

export interface IProductTimelineItem {
  id: string;
  type: 'transfer' | 'bulk-import';
  action: string;
  createdAt: string;
  payload: Record<string, unknown>;
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

  getTransfers(options?: {
    sku?: string;
    page?: number;
    limit?: number;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Observable<ITransfersResponse> {
    const query = new URLSearchParams();

    if (options?.sku) {
      query.set('sku', options.sku);
    }

    if (options?.page) {
      query.set('page', String(options.page));
    }

    if (options?.limit) {
      query.set('limit', String(options.limit));
    }

    if (options?.status) {
      query.set('status', options.status);
    }

    if (options?.fromDate) {
      query.set('fromDate', options.fromDate);
    }

    if (options?.toDate) {
      query.set('toDate', options.toDate);
    }

    const params = query.toString();
    const path = params ? `${this.apiUrl}/transfers?${params}` : `${this.apiUrl}/transfers`;
    return this.http.get<ITransfersResponse>(path);
  }

  getRelatedProducts(sku: string): Observable<IRelatedProductsResponse> {
    return this.http.get<IRelatedProductsResponse>(`/api/products/${sku}/related`);
  }

  getProductTimeline(sku: string, limit: number = 50): Observable<{ success: boolean; message: string; data: IProductTimelineItem[] }> {
    return this.http.get<{ success: boolean; message: string; data: IProductTimelineItem[] }>(`/api/products/${sku}/timeline?limit=${limit}`);
  }

  rollbackTransfer(transferId: string, reason?: string): Observable<ITransferResponse> {
    return this.http.post<ITransferResponse>(`${this.apiUrl}/transfer/${transferId}/rollback`, { reason });
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
