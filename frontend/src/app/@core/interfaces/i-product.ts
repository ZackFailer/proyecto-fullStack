export interface IRelatedProductEntry {
  sku: string;
  type: 'derived-from' | 'component-of' | 'variant-of' | 'related';
}

export interface IProduct {
  id: string | number;
  _id?: string;
  tenantId?: string;
  productTypeId?: string;
  productTypeVersion?: number;
  sku?: string;
  ean?: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  status?: 'active' | 'inactive';
  img?: string;
  customAttributes?: Record<string, unknown>;
  relatedProducts?: IRelatedProductEntry[];
  createdAt?: string;
  updatedAt?: string;
}
