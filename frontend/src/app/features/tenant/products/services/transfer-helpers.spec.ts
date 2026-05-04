import { describe, expect, it } from 'vitest';
import {
  buildConversionPreviewLine,
  canTransferByRole,
  canViewRelatedByRole,
  relatedProductNavigationSegments,
} from './transfer-helpers';

describe('transfer-helpers', () => {
  it('allows transfer only for admin and super-admin', () => {
    expect(canTransferByRole('admin')).toBe(true);
    expect(canTransferByRole('super-admin')).toBe(true);
    expect(canTransferByRole('operator')).toBe(false);
    expect(canTransferByRole('viewer')).toBe(false);
  });

  it('allows related products view for admin/operator/super-admin', () => {
    expect(canViewRelatedByRole('admin')).toBe(true);
    expect(canViewRelatedByRole('operator')).toBe(true);
    expect(canViewRelatedByRole('super-admin')).toBe(true);
    expect(canViewRelatedByRole('viewer')).toBe(false);
  });

  it('builds conversion preview formula text', () => {
    const line = buildConversionPreviewLine({
      quantityFrom: 5,
      quantityTo: 100,
      conversionApplied: true,
      conversionPreview: {
        fromAttribute: 'peso_gramos',
        toAttribute: 'peso_gramos',
        fromValue: 20000,
        toValue: 1000,
      },
    });

    expect(line).toContain('(5 * 20000) / 1000 = 100');
  });

  it('builds 1:1 preview text when conversion is not applied', () => {
    const line = buildConversionPreviewLine({
      quantityFrom: 7,
      quantityTo: 7,
      conversionApplied: false,
    });

    expect(line).toBe('7 -> 7 (1 a 1)');
  });

  it('returns relative segments for related product navigation', () => {
    expect(relatedProductNavigationSegments('SKU-008')).toEqual(['..', 'SKU-008']);
  });
});
