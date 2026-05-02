import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type ProductAttributeType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';

export interface IProductAttribute {
  key: string;
  label: string;
  type: ProductAttributeType;
  required: boolean;
  options?: string[];
  defaultValue?: string | number | boolean | null;
  order: number;
  version: number;
  isDeprecated?: boolean;
  isActive: boolean;
}

export interface IProductType {
  id: string;
  name: string;
  version: number;
  isActive: boolean;
  status: 'draft' | 'published';
  lastPublishedAt?: string;
  attributes: Array<IProductAttribute>;
}

export interface CreateProductTypePayload {
  name: string;
  isActive: boolean;
  attributes: Array<{
    key: string;
    label: string;
    type: ProductAttributeType;
    required: boolean;
    options?: string[];
  }>;
}

export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class ProductTypeApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/product-types';

  getProductTypes(): Observable<IApiResponse<IProductType[]>> {
    return this.http.get<IApiResponse<IProductType[]>>(this.apiUrl);
  }

  getProductType(id: string): Observable<IApiResponse<IProductType>> {
    return this.http.get<IApiResponse<IProductType>>(`${this.apiUrl}/${id}`);
  }

  createProductType(payload: CreateProductTypePayload): Observable<IApiResponse<IProductType>> {
    return this.http.post<IApiResponse<IProductType>>(this.apiUrl, payload);
  }

  updateProductType(id: string, payload: Partial<CreateProductTypePayload>): Observable<IApiResponse<IProductType>> {
    return this.http.put<IApiResponse<IProductType>>(`${this.apiUrl}/${id}`, payload);
  }

  deleteProductType(id: string): Observable<IApiResponse<null>> {
    return this.http.delete<IApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}