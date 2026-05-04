import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../models/product.model.js', () => {
  const findOne = vi.fn()
  const updateOne = vi.fn()
  const findById = vi.fn()
  const Product = {
    findOne,
    updateOne,
    findById,
    db: {
      client: {
        startSession: vi.fn(),
      },
    },
  }

  return { Product }
})

vi.mock('../models/product-type.model.js', () => {
  const findOne = vi.fn()
  return {
    ProductType: { findOne },
  }
})

vi.mock('../models/inventory-transfer.model.js', () => {
  const findOne = vi.fn()
  const find = vi.fn()
  const countDocuments = vi.fn()
  const updateOne = vi.fn()

  const InventoryTransfer = vi.fn().mockImplementation(function (this: any, payload: Record<string, unknown>) {
    Object.assign(this, payload)
    this.save = vi.fn().mockResolvedValue(undefined)
  })

  ;(InventoryTransfer as unknown as { findOne: typeof findOne }).findOne = findOne
  ;(InventoryTransfer as unknown as { find: typeof find }).find = find
  ;(InventoryTransfer as unknown as { countDocuments: typeof countDocuments }).countDocuments = countDocuments
  ;(InventoryTransfer as unknown as { updateOne: typeof updateOne }).updateOne = updateOne

  return { InventoryTransfer }
})

import { Product } from '../models/product.model.js'
import { ProductType } from '../models/product-type.model.js'
import { InventoryTransfer } from '../models/inventory-transfer.model.js'
import {
  markTransferAsReverted,
  previewTransfer,
  rollbackTransfer,
  transferInventory,
} from '../services/inventory-transfer.service.js'

const tenantId = '507f1f77bcf86cd799439011'
const userId = '507f1f77bcf86cd799439012'

const createLeanResult = (value: unknown) => ({
  lean: vi.fn().mockResolvedValue(value),
  select: vi.fn().mockReturnThis(),
})

describe('inventory-transfer.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('applies conversion and returns converted quantity', async () => {
    vi.mocked(Product.findOne)
      .mockReturnValueOnce(createLeanResult({
        _id: 'from-id',
        sku: 'SACO-20KG',
        stock: 10,
        productTypeId: 'type-saco',
        customAttributes: { peso_gramos: 20000 },
      }) as never)
      .mockReturnValueOnce(createLeanResult({
        _id: 'to-id',
        sku: 'DETAL-1KG',
        stock: 50,
        productTypeId: 'type-detal',
        customAttributes: { peso_gramos: 1000 },
      }) as never)

    vi.mocked(ProductType.findOne)
      .mockReturnValueOnce(createLeanResult({ conversionAttribute: 'peso_gramos' }) as never)
      .mockReturnValueOnce(createLeanResult({ conversionAttribute: 'peso_gramos' }) as never)

    const endSession = vi.fn()
    vi.mocked(Product.db.client.startSession).mockResolvedValue({
      withTransaction: async (fn: () => Promise<void>) => fn(),
      endSession,
    } as never)
    vi.mocked(Product.updateOne).mockResolvedValue({ acknowledged: true } as never)
    vi.mocked(Product.findById)
      .mockReturnValueOnce(createLeanResult({ stock: 5 }) as never)
      .mockReturnValueOnce(createLeanResult({ stock: 150 }) as never)

    const result = await transferInventory(
      { fromSKU: 'SACO-20KG', toSKU: 'DETAL-1KG', quantity: 5 },
      tenantId,
      userId
    )

    expect(result.success).toBe(true)
    expect(result.quantityFrom).toBe(5)
    expect(result.quantityTo).toBe(100)
    expect(result.conversionApplied).toBe(true)
    expect(endSession).toHaveBeenCalledTimes(1)
  })

  it('falls back to 1:1 when conversion attributes are missing', async () => {
    vi.mocked(Product.findOne)
      .mockReturnValueOnce(createLeanResult({
        _id: 'from-id',
        sku: 'SKU-ORIGEN',
        stock: 10,
        productTypeId: 'type-origen',
        customAttributes: {},
      }) as never)
      .mockReturnValueOnce(createLeanResult({
        _id: 'to-id',
        sku: 'SKU-DESTINO',
        stock: 5,
        productTypeId: 'type-destino',
        customAttributes: {},
      }) as never)

    vi.mocked(ProductType.findOne)
      .mockReturnValueOnce(createLeanResult({ conversionAttribute: undefined }) as never)
      .mockReturnValueOnce(createLeanResult({ conversionAttribute: 'peso_gramos' }) as never)

    const endSession = vi.fn()
    vi.mocked(Product.db.client.startSession).mockResolvedValue({
      withTransaction: async (fn: () => Promise<void>) => fn(),
      endSession,
    } as never)
    vi.mocked(Product.updateOne).mockResolvedValue({ acknowledged: true } as never)
    vi.mocked(Product.findById)
      .mockReturnValueOnce(createLeanResult({ stock: 7 }) as never)
      .mockReturnValueOnce(createLeanResult({ stock: 8 }) as never)

    const result = await transferInventory(
      { fromSKU: 'SKU-ORIGEN', toSKU: 'SKU-DESTINO', quantity: 3 },
      tenantId,
      userId
    )

    expect(result.success).toBe(true)
    expect(result.quantityFrom).toBe(3)
    expect(result.quantityTo).toBe(3)
    expect(result.conversionApplied).toBe(false)
    expect(endSession).toHaveBeenCalledTimes(1)
  })

  it('rejects non-exact conversion in preview', async () => {
    vi.mocked(Product.findOne)
      .mockReturnValueOnce(createLeanResult({
        _id: 'from-id',
        sku: 'SKU-A',
        stock: 20,
        productTypeId: 'type-a',
        customAttributes: { peso_gramos: 1500 },
      }) as never)
      .mockReturnValueOnce(createLeanResult({
        _id: 'to-id',
        sku: 'SKU-B',
        stock: 30,
        productTypeId: 'type-b',
        customAttributes: { peso_gramos: 1000 },
      }) as never)

    vi.mocked(ProductType.findOne)
      .mockReturnValueOnce(createLeanResult({ conversionAttribute: 'peso_gramos' }) as never)
      .mockReturnValueOnce(createLeanResult({ conversionAttribute: 'peso_gramos' }) as never)

    await expect(previewTransfer({ fromSKU: 'SKU-A', toSKU: 'SKU-B', quantity: 1 }, tenantId)).rejects.toMatchObject({
      code: 'NON_INTEGER_CONVERSION',
    })
  })

  it('rejects transfer when fromSKU and toSKU are equal', async () => {
    await expect(
      transferInventory({ fromSKU: 'SKU-1', toSKU: 'SKU-1', quantity: 1 }, tenantId, userId)
    ).rejects.toMatchObject({ code: 'INVALID_SAME_SKU' })
  })

  it('rejects transfer when origin SKU is missing', async () => {
    vi.mocked(Product.findOne).mockReturnValueOnce(createLeanResult(null) as never)

    await expect(
      transferInventory({ fromSKU: 'MISSING', toSKU: 'SKU-2', quantity: 1 }, tenantId, userId)
    ).rejects.toMatchObject({ code: 'FROM_SKU_NOT_FOUND' })
  })

  it('rejects transfer when stock is insufficient', async () => {
    vi.mocked(Product.findOne)
      .mockReturnValueOnce(createLeanResult({
        _id: 'from-id',
        sku: 'SKU-ORIGEN',
        stock: 2,
        productTypeId: 'type-origen',
        customAttributes: {},
      }) as never)
      .mockReturnValueOnce(createLeanResult({
        _id: 'to-id',
        sku: 'SKU-DESTINO',
        stock: 0,
        productTypeId: 'type-destino',
        customAttributes: {},
      }) as never)

    await expect(
      transferInventory({ fromSKU: 'SKU-ORIGEN', toSKU: 'SKU-DESTINO', quantity: 5 }, tenantId, userId)
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' })
  })

  it('marks transfer as reverted', async () => {
    vi.mocked((InventoryTransfer as unknown as { updateOne: typeof vi.fn }).updateOne).mockResolvedValue({
      acknowledged: true,
      modifiedCount: 1,
    } as never)

    await expect(markTransferAsReverted('507f1f77bcf86cd799439013', tenantId)).resolves.toBeUndefined()
    expect((InventoryTransfer as unknown as { updateOne: typeof vi.fn }).updateOne).toHaveBeenCalledTimes(1)
  })

  it('rolls back a completed transfer by creating inverse transfer', async () => {
    vi.mocked((InventoryTransfer as unknown as { findOne: typeof vi.fn }).findOne)
      .mockReturnValueOnce(createLeanResult({
        _id: '507f1f77bcf86cd799439013',
        status: 'completed',
        fromSKU: 'SKU-A',
        toSKU: 'SKU-B',
        quantityFrom: 10,
        quantityTo: 5,
      }) as never)
      .mockReturnValueOnce(createLeanResult(null) as never)

    vi.mocked(Product.findOne)
      .mockReturnValueOnce(createLeanResult({
        _id: 'from-id',
        sku: 'SKU-B',
        stock: 20,
        productTypeId: 'type-b',
        customAttributes: {},
      }) as never)
      .mockReturnValueOnce(createLeanResult({
        _id: 'to-id',
        sku: 'SKU-A',
        stock: 0,
        productTypeId: 'type-a',
        customAttributes: {},
      }) as never)

    vi.mocked(ProductType.findOne)
      .mockReturnValueOnce(createLeanResult({ conversionAttribute: undefined }) as never)
      .mockReturnValueOnce(createLeanResult({ conversionAttribute: undefined }) as never)

    vi.mocked(Product.db.client.startSession).mockResolvedValue({
      withTransaction: async (fn: () => Promise<void>) => fn(),
      endSession: vi.fn(),
    } as never)

    vi.mocked(Product.updateOne).mockResolvedValue({ acknowledged: true } as never)
    vi.mocked(Product.findById)
      .mockReturnValueOnce(createLeanResult({ stock: 15 }) as never)
      .mockReturnValueOnce(createLeanResult({ stock: 5 }) as never)

    const result = await rollbackTransfer('507f1f77bcf86cd799439013', tenantId, userId)

    expect(result.success).toBe(true)
    expect(result.fromSKU).toBe('SKU-B')
    expect(result.toSKU).toBe('SKU-A')
  })

  it('rejects rollback when transfer is not completed', async () => {
    vi.mocked((InventoryTransfer as unknown as { findOne: typeof vi.fn }).findOne)
      .mockReturnValueOnce(createLeanResult({
        _id: '507f1f77bcf86cd799439013',
        status: 'failed',
        fromSKU: 'SKU-A',
        toSKU: 'SKU-B',
        quantityFrom: 10,
        quantityTo: 5,
      }) as never)

    await expect(rollbackTransfer('507f1f77bcf86cd799439013', tenantId, userId)).rejects.toMatchObject({
      code: 'TRANSFER_NOT_REVERSIBLE',
    })
  })
})
