import { describe, expect, it, vi, beforeEach } from 'vitest'
import { BulkProcess } from '../models/bulk-process.model.js'
import {
  determineProcessOutcome,
  detectCsvFormat,
  mapRowToAttributes,
  parseCSV,
  parseRelatedProductsFromCell,
  validateRelatedProductsForImport,
  startBulkImport,
  validateRow,
} from '../services/bulk-import.service.js'

describe('bulk import upsert service', () => {
  const productType = {
    id: 'type-food',
    _id: '507f1f77bcf86cd799439011',
    version: 1,
    isActive: true,
    attributes: [
      {
        key: 'fragile',
        label: 'Frágil',
        type: 'boolean',
        required: false,
        csvColumn: 1,
        isActive: true,
        isDeprecated: false,
      },
    ],
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('parses action column case-insensitive', () => {
    const rows = parseCSV('SKU,Name,productTypeId,price,stock,category,Action\nSKU-1,A,type-food,10,2,CAT,inactive')
    expect(rows).toHaveLength(1)
    expect(rows[0].action).toBe('inactive')
  })

  it('marks invalid action in row metadata', () => {
    const rows = parseCSV('sku,name,productTypeId,price,stock,category,action\nSKU-1,A,type-food,10,2,CAT,archive')
    expect(rows[0].invalidAction).toBe('archive')
    expect(rows[0].action).toBe('active')
  })

  it('creates action for new product rows', () => {
    const rows = parseCSV('sku,name,productTypeId,price,stock,category\nSKU-1,A,type-food,10,2,CAT')
    const result = validateRow(rows[0], productType)
    expect(result.isValid).toBe(true)
    expect(result.action).toBe('created')
  })

  it('updates action for existing active product rows', () => {
    const rows = parseCSV('sku,name,productTypeId,price,stock,category\nSKU-1,A,type-food,10,2,CAT')
    const existing = { status: 'active', customAttributes: {}, productTypeId: 'type-food' } as any
    const result = validateRow(rows[0], productType, existing)
    expect(result.isValid).toBe(true)
    expect(result.action).toBe('updated')
  })

  it('reactivates action for existing inactive product rows', () => {
    const rows = parseCSV('sku,name,productTypeId,price,stock,category\nSKU-1,A,type-food,10,2,CAT')
    const existing = { status: 'inactive', customAttributes: {}, productTypeId: 'type-food' } as any
    const result = validateRow(rows[0], productType, existing)
    expect(result.isValid).toBe(true)
    expect(result.action).toBe('reactivated')
    expect(result.productData?.status).toBe('active')
  })

  it('deactivates when action inactive is requested', () => {
    const rows = parseCSV('sku,name,productTypeId,price,stock,category,action\nSKU-1,A,type-food,10,2,CAT,inactive')
    const existing = { status: 'active', customAttributes: {}, productTypeId: 'type-food' } as any
    const result = validateRow(rows[0], productType, existing)
    expect(result.isValid).toBe(true)
    expect(result.action).toBe('deactivated')
    expect(result.productData?.status).toBe('inactive')
  })

  it('deletes logically when action deleted is requested', () => {
    const rows = parseCSV('sku,name,productTypeId,price,stock,category,action\nSKU-1,A,type-food,10,2,CAT,deleted')
    const existing = { status: 'inactive', customAttributes: {}, productTypeId: 'type-food' } as any
    const result = validateRow(rows[0], productType, existing)
    expect(result.isValid).toBe(true)
    expect(result.action).toBe('deleted')
    expect(result.productData?.status).toBe('inactive')
  })

  it('fails when inactive action targets non-existent product', () => {
    const rows = parseCSV('sku,name,productTypeId,price,stock,category,action\nSKU-1,A,type-food,10,2,CAT,inactive')
    const result = validateRow(rows[0], productType)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'ACTION_ON_NONEXISTENT')).toBe(true)
  })

  it('fails when deleted action targets non-existent product', () => {
    const rows = parseCSV('sku,name,productTypeId,price,stock,category,action\nSKU-1,A,type-food,10,2,CAT,deleted')
    const result = validateRow(rows[0], productType)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'ACTION_ON_NONEXISTENT')).toBe(true)
  })

  it('validates sku format and length', () => {
    const tooLongSku = 'A'.repeat(65)
    const rows = parseCSV(`sku,name,productTypeId,price,stock,category\n${tooLongSku},A,type-food,10,2,CAT`)
    const result = validateRow(rows[0], productType)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_LENGTH')).toBe(true)
  })

  it('returns partial status for mixed outcomes', () => {
    const outcome = determineProcessOutcome(3, 2)
    expect(outcome.status).toBe('partial')
    expect(outcome.errorSummary).toContain('2 productos con errores')
  })

  it('returns failed status when all rows fail', () => {
    const outcome = determineProcessOutcome(0, 4)
    expect(outcome.status).toBe('failed')
    expect(outcome.errorSummary).toContain('Todos los productos fallaron')
  })

  it('detects multi-type format when attr_N headers are present', () => {
    const detection = detectCsvFormat(['sku', 'name', 'productTypeId', 'attr_1', 'attr_2'])
    expect(detection.format).toBe('multi-type')
  })

  it('maps attr_N columns using csvColumn metadata', () => {
    const typeWithColumns = {
      ...productType,
      attributes: [
        {
          key: 'peso_gramos',
          label: 'Peso gramos',
          type: 'number',
          required: true,
          csvColumn: 1,
          isActive: true,
          isDeprecated: false,
        },
        {
          key: 'color',
          label: 'Color',
          type: 'text',
          required: false,
          csvColumn: 2,
          isActive: true,
          isDeprecated: false,
        },
      ],
    } as any

    const mapped = mapRowToAttributes(
      {
        sku: 'SKU-1',
        productTypeId: 'type-food',
        attr_1: '1500',
        attr_2: 'Rojo',
        attr_9: 'ignored',
      },
      'multi-type',
      typeWithColumns
    )

    expect(mapped).toMatchObject({ peso_gramos: 1500, color: 'Rojo' })
    expect(mapped).not.toHaveProperty('attr_9')
  })

  it('accepts single-type rows using attribute labels as headers', () => {
    const typeWithLabel = {
      ...productType,
      attributes: [
        {
          key: 'peso_gramos',
          label: 'Peso Gramos',
          type: 'number',
          required: true,
          isActive: true,
          isDeprecated: false,
        },
      ],
    } as any

    const mapped = mapRowToAttributes(
      {
        sku: 'SKU-1',
        name: 'Arroz',
        'Peso Gramos': '2500',
      },
      'single-type',
      typeWithLabel
    )

    expect(mapped).toMatchObject({ peso_gramos: 2500 })
  })

  it('validates required attributes from attr_N columns in multi-type rows', () => {
    const typeWithRequiredColumn = {
      ...productType,
      attributes: [
        {
          key: 'peso_gramos',
          label: 'Peso gramos',
          type: 'number',
          required: true,
          csvColumn: 1,
          isActive: true,
          isDeprecated: false,
        },
      ],
    } as any

    const missingRequiredRows = parseCSV('sku,name,productTypeId,price,stock,category,attr_1\nSKU-1,A,type-food,10,2,CAT,')
    const missingRequiredResult = validateRow(missingRequiredRows[0], typeWithRequiredColumn)
    expect(missingRequiredResult.isValid).toBe(false)
    expect(missingRequiredResult.errors.some((e) => e.code === 'MISSING_REQUIRED_FIELD')).toBe(true)

    const validRows = parseCSV('sku,name,productTypeId,price,stock,category,attr_1\nSKU-1,A,type-food,10,2,CAT,2000')
    const validResult = validateRow(validRows[0], typeWithRequiredColumn)
    expect(validResult.isValid).toBe(true)
    expect(validResult.productData?.customAttributes).toMatchObject({ peso_gramos: 2000 })
  })

  it('rejects concurrent import lock for same tenant', async () => {
    vi.spyOn(BulkProcess, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: 'proc-1',
        status: 'processing',
        updatedAt: new Date(),
      }),
    } as any)

    await expect(
      startBulkImport(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        'test.csv',
        120,
        'sku,name,productTypeId,price,stock,category\nSKU-1,A,type-food,10,2,CAT'
      )
    ).rejects.toMatchObject({ code: 'CONCURRENT_IMPORT' })
  })

  // CSV Parser with quoted cells
  it('parses CSV with quoted cell containing commas', () => {
    const csv = 'sku,name,productTypeId,price,stock,category,relatedProducts\nSKU-1,Product A,type-food,10,2,CAT,"SKU-002:variant-of,SKU-003:component-of"'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].data.relatedProducts).toBe('SKU-002:variant-of,SKU-003:component-of')
  })

  it('parses CSV with escaped quotes inside cells', () => {
    const csv = 'sku,name,productTypeId,price,stock,category\nSKU-1,"Product with ""quotes""",type-food,10,2,CAT'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].data.name).toBe('Product with "quotes"')
  })

  it('parses CSV with empty quoted cells', () => {
    const csv = 'sku,name,productTypeId,price,stock,category\nSKU-1,"",type-food,10,2,CAT'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].data.name).toBe('')
  })

  it('parses CSV with multiple quoted cells', () => {
    const csv = 'sku,name,productTypeId,price,stock,category,relatedProducts\nSKU-1,"Name with , comma",type-food,10,2,CAT,"SKU-002:variant-of,SKU-003:related"'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].data.name).toBe('Name with , comma')
    expect(rows[0].data.relatedProducts).toBe('SKU-002:variant-of,SKU-003:related')
  })

  // relatedProducts parsing tests
  it('parses relatedProducts from cell with single entry', () => {
    const result = parseRelatedProductsFromCell('SKU-002:variant-of')
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0]).toEqual({ sku: 'SKU-002', type: 'variant-of' })
    expect(result.warnings).toHaveLength(0)
  })

  it('parses relatedProducts from cell with multiple entries', () => {
    const result = parseRelatedProductsFromCell('SKU-002:variant-of,SKU-003:component-of,SKU-004:related')
    expect(result.entries).toHaveLength(3)
    expect(result.entries[0]).toEqual({ sku: 'SKU-002', type: 'variant-of' })
    expect(result.entries[1]).toEqual({ sku: 'SKU-003', type: 'component-of' })
    expect(result.entries[2]).toEqual({ sku: 'SKU-004', type: 'related' })
    expect(result.warnings).toHaveLength(0)
  })

  it('parses relatedProducts with valid derived-from type', () => {
    const result = parseRelatedProductsFromCell('SKU-002:derived-from')
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].type).toBe('derived-from')
  })

  it('returns warning for invalid format (missing type)', () => {
    const result = parseRelatedProductsFromCell('SKU-002')
    expect(result.entries).toHaveLength(0)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].reason).toContain('falta tipo')
  })

  it('returns warning for invalid type', () => {
    const result = parseRelatedProductsFromCell('SKU-002:invalid-type')
    expect(result.entries).toHaveLength(0)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].reason).toContain('Tipo inválido')
  })

  it('returns warning for duplicate SKU in same cell', () => {
    const result = parseRelatedProductsFromCell('SKU-002:variant-of,SKU-002:component-of')
    expect(result.entries).toHaveLength(1)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].reason).toContain('duplicado')
  })

  it('returns warning for invalid SKU format', () => {
    const result = parseRelatedProductsFromCell('SKU with spaces:variant-of')
    expect(result.entries).toHaveLength(0)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].reason).toContain('inválidos')
  })

  it('handles empty relatedProducts cell', () => {
    const result = parseRelatedProductsFromCell('')
    expect(result.entries).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it('handles whitespace-only relatedProducts cell', () => {
    const result = parseRelatedProductsFromCell('   ')
    expect(result.entries).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  // validateRelatedProductsForImport tests
  it('detects and removes self-references', () => {
    const entries = [
      { sku: 'SKU-001', type: 'variant-of' as const },
      { sku: 'SKU-002', type: 'component-of' as const },
    ]
    const result = validateRelatedProductsForImport(entries, 'SKU-001')
    expect(result.validEntries).toHaveLength(1)
    expect(result.validEntries[0].sku).toBe('SKU-002')
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].reason).toContain('Autorreferencia')
  })

  it('keeps all entries when no self-references', () => {
    const entries = [
      { sku: 'SKU-002', type: 'variant-of' as const },
      { sku: 'SKU-003', type: 'component-of' as const },
    ]
    const result = validateRelatedProductsForImport(entries, 'SKU-001')
    expect(result.validEntries).toHaveLength(2)
    expect(result.warnings).toHaveLength(0)
  })

  it('handles case-insensitive self-reference detection', () => {
    const entries = [
      { sku: 'sku-001', type: 'variant-of' as const },
    ]
    const result = validateRelatedProductsForImport(entries, 'SKU-001')
    expect(result.validEntries).toHaveLength(0)
    expect(result.warnings).toHaveLength(1)
  })
})
