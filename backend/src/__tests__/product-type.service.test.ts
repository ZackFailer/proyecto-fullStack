import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExcelJS from 'exceljs'

vi.mock('../models/product-type.model.js', () => {
  const findOne = vi.fn()
  const findOneAndUpdate = vi.fn()
  const ProductType = vi.fn().mockImplementation(function (this: any, payload: Record<string, unknown>) {
    Object.assign(this, payload)
    this.save = vi.fn().mockResolvedValue({
      toJSON: () => ({ ...payload, attributes: payload.attributes }),
    })
  })

  ;(ProductType as unknown as Record<string, unknown>).findOne = findOne
  ;(ProductType as unknown as Record<string, unknown>).findOneAndUpdate = findOneAndUpdate

  return { ProductType }
})

import { ProductType } from '../models/product-type.model.js'
import { createProductType, generateMultiTypeExcelTemplate, updateProductType } from '../services/product-type.service.js'

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

describe('product-type.service csvColumn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('accepts create with csvColumn values', async () => {
    const result = await createProductType(tenantId, {
      name: 'Ropa',
      attributes: [
        { key: 'color', label: 'Color', type: 'select', required: true, options: ['rojo', 'azul'], csvColumn: 1 },
        { key: 'talla', label: 'Talla', type: 'text', required: true, csvColumn: 2 },
        { key: 'material', label: 'Material', type: 'text', required: false, csvColumn: 3 },
      ],
    })

    expect(result).toBeDefined()
    expect(result.attributes[0].csvColumn).toBe(1)
    expect(result.attributes[1].csvColumn).toBe(2)
    expect(result.attributes[2].csvColumn).toBe(3)
  })

  it('rejects duplicate csvColumn values', async () => {
    await expect(
      createProductType(tenantId, {
        name: 'Ropa',
        attributes: [
          { key: 'color', label: 'Color', type: 'text', required: true, csvColumn: 1 },
          { key: 'talla', label: 'Talla', type: 'text', required: true, csvColumn: 1 },
        ],
      })
    ).rejects.toMatchObject({ code: 'DUPLICATE_CSV_COLUMN' })
  })

  it('rejects csvColumn outside 1-10 range', async () => {
    await expect(
      createProductType(tenantId, {
        name: 'Ropa',
        attributes: [
          { key: 'color', label: 'Color', type: 'text', required: true, csvColumn: 11 },
        ],
      })
    ).rejects.toMatchObject({ code: 'INVALID_CSV_COLUMN' })
  })
})

describe('product-type.service consolidado template formulas', () => {
  it('generates attr formulas for a single type and leaves unmapped attrs empty', async () => {
    const buffer = await generateMultiTypeExcelTemplate([
      {
        id: 'type-food',
        name: 'Comida',
        version: 2,
        isActive: true,
        attributes: [
          { key: 'peso', label: 'Peso', type: 'number', csvColumn: 1, isActive: true, isDeprecated: false },
          { key: 'marca', label: 'Marca', type: 'text', csvColumn: 2, isActive: true, isDeprecated: false },
          { key: 'color', label: 'Color', type: 'text', csvColumn: 3, isActive: true, isDeprecated: false },
        ],
      } as any,
    ])

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const consolidado = workbook.getWorksheet('Consolidado')
    expect(consolidado).toBeDefined()

    const row2 = consolidado!.getRow(2)
    expect((row2.getCell(1).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Comida'!C2=\"\",\"\",'Comida'!C2)")
    expect(row2.getCell(4).value).toBe('type-food')
    expect(row2.getCell(5).value).toBe('2')

    // Column 9 is now relatedProducts
    expect((row2.getCell(9).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Comida'!I2=\"\",\"\",'Comida'!I2)")
    // Attr columns shifted by 1 due to relatedProducts
    expect((row2.getCell(10).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Comida'!J2=\"\",\"\",'Comida'!J2)")
    expect((row2.getCell(11).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Comida'!K2=\"\",\"\",'Comida'!K2)")
    expect((row2.getCell(12).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Comida'!L2=\"\",\"\",'Comida'!L2)")
    expect(row2.getCell(13).value).toBe('')
    expect(row2.getCell(19).value).toBe('')
  })

  it('allocates fixed 1000-row blocks and maps formulas by csvColumn per type', async () => {
    const buffer = await generateMultiTypeExcelTemplate([
      {
        id: 'type-a',
        name: 'Tipo A',
        version: 1,
        isActive: true,
        attributes: [
          { key: 'a1', label: 'A1', type: 'text', csvColumn: 1, isActive: true, isDeprecated: false },
          { key: 'a3', label: 'A3', type: 'text', csvColumn: 3, isActive: true, isDeprecated: false },
          { key: 'a5', label: 'A5', type: 'text', csvColumn: 5, isActive: true, isDeprecated: false },
        ],
      } as any,
      {
        id: 'type-b',
        name: 'Tipo B',
        version: 4,
        isActive: true,
        attributes: [
          { key: 'b2', label: 'B2', type: 'text', csvColumn: 2, isActive: true, isDeprecated: false },
          { key: 'b4', label: 'B4', type: 'text', csvColumn: 4, isActive: true, isDeprecated: false },
          { key: 'b6', label: 'B6', type: 'text', csvColumn: 6, isActive: true, isDeprecated: false },
        ],
      } as any,
    ])

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const consolidado = workbook.getWorksheet('Consolidado')!

    const firstTypeRow = consolidado.getRow(2)
    const secondTypeRow = consolidado.getRow(1002)

    expect((firstTypeRow.getCell(1).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Tipo A'!C2=\"\",\"\",'Tipo A'!C2)")
    expect(firstTypeRow.getCell(4).value).toBe('type-a')
    // Column 9 = relatedProducts formula
    expect((firstTypeRow.getCell(9).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Tipo A'!I2=\"\",\"\",'Tipo A'!I2)")
    // Columns map as: col10=csv1, col11=csv2, col12=csv3, col13=csv4, col14=csv5
    // Tipo A uses csvColumn 1,3,5 → attributes at positions 0,1,2 → columns 10,11,12
    expect((firstTypeRow.getCell(10).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Tipo A'!J2=\"\",\"\",'Tipo A'!J2)") // csvColumn 1 → position 0 → column J
    expect(firstTypeRow.getCell(11).value).toBe('') // csvColumn 2 not used
    expect((firstTypeRow.getCell(12).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Tipo A'!K2=\"\",\"\",'Tipo A'!K2)") // csvColumn 3 → position 1 → column K
    expect(firstTypeRow.getCell(13).value).toBe('') // csvColumn 4 not used
    expect((firstTypeRow.getCell(14).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Tipo A'!L2=\"\",\"\",'Tipo A'!L2)") // csvColumn 5 → position 2 → column L

    expect((secondTypeRow.getCell(1).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Tipo B'!C2=\"\",\"\",'Tipo B'!C2)")
    expect(secondTypeRow.getCell(4).value).toBe('type-b')
    // Column 9 = relatedProducts formula
    expect((secondTypeRow.getCell(9).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Tipo B'!I2=\"\",\"\",'Tipo B'!I2)")
    // Tipo B uses csvColumn 2,4,6 → attributes at positions 0,1,2 → columns 10,11,12
    // But the target columns are based on csvColumn numbers, not positions
    expect(secondTypeRow.getCell(10).value).toBe('') // csvColumn 1 not used
    expect((secondTypeRow.getCell(11).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Tipo B'!J2=\"\",\"\",'Tipo B'!J2)") // csvColumn 2 → column J
    // Column 12 corresponds to csvColumn 3 which is not used → empty
    expect(secondTypeRow.getCell(12).value).toBe('')
    expect((secondTypeRow.getCell(13).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Tipo B'!K2=\"\",\"\",'Tipo B'!K2)") // csvColumn 4 → column K
  })

  it('advances blocks correctly for three active types', async () => {
    const buffer = await generateMultiTypeExcelTemplate([
      { id: 'type-1', name: 'Uno', version: 1, isActive: true, attributes: [] } as any,
      { id: 'type-2', name: 'Dos', version: 1, isActive: true, attributes: [] } as any,
      { id: 'type-3', name: 'Tres', version: 1, isActive: true, attributes: [] } as any,
    ])

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const consolidado = workbook.getWorksheet('Consolidado')!

    expect((consolidado.getRow(2).getCell(1).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Uno'!C2=\"\",\"\",'Uno'!C2)")
    expect((consolidado.getRow(1002).getCell(1).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Dos'!C2=\"\",\"\",'Dos'!C2)")
    expect((consolidado.getRow(2002).getCell(1).value as ExcelJS.CellFormulaValue).formula).toBe("IF('Tres'!C2=\"\",\"\",'Tres'!C2)")
  })
})
