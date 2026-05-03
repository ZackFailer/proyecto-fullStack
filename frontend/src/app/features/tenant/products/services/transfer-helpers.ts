export type TenantRole = 'super-admin' | 'admin' | 'operator' | 'viewer';

export interface ConversionPreviewData {
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

export const canTransferByRole = (role: TenantRole): boolean => role === 'admin' || role === 'super-admin';

export const canViewRelatedByRole = (role: TenantRole): boolean =>
  role === 'admin' || role === 'operator' || role === 'super-admin';

export const relatedProductNavigationSegments = (sku: string): string[] => ['..', sku];

export const buildConversionPreviewLine = (preview: ConversionPreviewData): string => {
  if (!preview.conversionApplied || !preview.conversionPreview) {
    return `${preview.quantityFrom} -> ${preview.quantityTo} (1 a 1)`;
  }

  return `(${preview.quantityFrom} * ${preview.conversionPreview.fromValue}) / ${preview.conversionPreview.toValue} = ${preview.quantityTo}`;
};
