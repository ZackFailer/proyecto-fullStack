import { describe, expect, it, vi, beforeEach } from 'vitest'
import { BulkProcess } from '../models/bulk-process.model.js'
import { determineProcessOutcome, parseCSV, startBulkImport, validateRow } from '../services/bulk-import.service.js'

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
})
