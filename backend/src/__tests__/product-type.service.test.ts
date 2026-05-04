import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../models/product-type.model.js', () => {
  const findOne = vi.fn()
  const findOneAndUpdate = vi.fn()
  const ProductType = vi.fn().mockImplementation(function (this: any, payload: Record<string, unknown>) {
    Object.assign(this, payload)
    this.save = vi.fn().mockResolvedValue({
      toJSON: () => ({ ...payload }),
    })
  })

  ;(ProductType as unknown as Record<string, unknown>).findOne = findOne
  ;(ProductType as unknown as Record<string, unknown>).findOneAndUpdate = findOneAndUpdate

  return { ProductType }
})

import { ProductType } from '../models/product-type.model.js'
import { createProductType, updateProductType } from '../services/product-type.service.js'

const tenantId = '507f1f77bcf86cd799439011'

describe('product-type.service conversionAttribute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects create when conversionAttribute key is missing', async () => {
    await expect(
      createProductType(tenantId, {
        name: 'Saco',
        conversionAttribute: 'peso_gramos',
        attributes: [
          { key: 'color', label: 'Color', type: 'text', required: false },
        ],
      })
    ).rejects.toMatchObject({ code: 'INVALID_CONVERSION_ATTRIBUTE' })
  })

  it('rejects create when conversionAttribute points to non-number attribute', async () => {
    await expect(
      createProductType(tenantId, {
        name: 'Saco',
        conversionAttribute: 'peso_gramos',
        attributes: [
          { key: 'peso_gramos', label: 'Peso', type: 'text', required: true },
        ],
      })
    ).rejects.toMatchObject({ code: 'INVALID_CONVERSION_ATTRIBUTE_TYPE' })
  })

  it('rejects update when conversionAttribute key is missing', async () => {
    vi.mocked((ProductType as unknown as { findOne: typeof vi.fn }).findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        id: 'type-saco',
        version: 1,
        status: 'draft',
        attributes: [{ key: 'peso', type: 'number', required: true }],
      }),
    } as never)

    await expect(
      updateProductType(tenantId, 'type-saco', {
        conversionAttribute: 'peso_gramos',
      })
    ).rejects.toMatchObject({ code: 'INVALID_CONVERSION_ATTRIBUTE' })
  })
})
