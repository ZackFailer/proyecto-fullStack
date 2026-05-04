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
  csvColumn?: number;
}

export interface IProductType {
  id: string;
  name: string;
  conversionAttribute?: string;
  version: number;
  isActive: boolean;
  attributes: Array<IProductAttribute>;
  lastPublishedAt?: string;
  status: 'draft' | 'published';
}

export interface INewProductType {
  name: string;
  isActive: boolean;
}

export interface INewProductTypeWithAttributes extends INewProductType {
  conversionAttribute?: string;
  attributes: Array<{
    key: string;
    label: string;
    type: ProductAttributeType;
    required: boolean;
    options?: ReadonlyArray<string>;
    csvColumn?: number;
  }>;
}

export interface IProductSettingsMetrics {
  activeTypes: number;
  totalAttributes: number;
  deprecatedAttributes: number;
  publishedTypes: number;
}
