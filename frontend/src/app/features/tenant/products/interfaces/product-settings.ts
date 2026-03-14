export type ProductAttributeType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';

export interface IProductAttribute {
  key: string;
  label: string;
  type: ProductAttributeType;
  required: boolean;
  options?: ReadonlyArray<string>;
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
  attributes: ReadonlyArray<IProductAttribute>;
  lastPublishedAt: string;
  status: 'draft' | 'published';
}

export interface INewProductType {
  name: string;
  isActive: boolean;
}

export interface INewProductTypeWithAttributes extends INewProductType {
  attributes: Array<{
    key: string;
    label: string;
    type: ProductAttributeType;
    required: boolean;
    options?: ReadonlyArray<string>;
  }>;
}

export interface IProductSettingsMetrics {
  activeTypes: number;
  totalAttributes: number;
  deprecatedAttributes: number;
  publishedTypes: number;
}
