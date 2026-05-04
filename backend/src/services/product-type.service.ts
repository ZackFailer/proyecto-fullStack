import { isValidObjectId, Types } from 'mongoose'
import ExcelJS from 'exceljs'
import { IProductType, IProductAttribute, ProductType, ProductAttributeType } from '../models/product-type.model.js'

export interface ServiceError extends Error {
  status?: number
  code?: string
  details?: unknown
}

export interface CreateProductTypeInput {
  name: string
  isActive?: boolean
  conversionAttribute?: string
  attributes?: Array<{
    key: string
    label: string
    type: ProductAttributeType
    required: boolean
    options?: string[]
    defaultValue?: string | number | boolean | null
    csvColumn?: number
  }>
}

export interface UpdateProductTypeInput {
  name?: string
  isActive?: boolean
  status?: 'draft' | 'published'
  conversionAttribute?: string
  attributes?: Array<{
    key: string
    label: string
    type: ProductAttributeType
    required: boolean
    options?: string[]
    defaultValue?: string | number | boolean | null
    csvColumn?: number
  }>
}

const buildError = (status: number, code: string, message: string, details?: unknown): ServiceError => {
  const err = new Error(message) as ServiceError
  err.status = status
  err.code = code
  if (details) {
    err.details = details
  }
  return err
}

const generateProductTypeId = (name: string): string => {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  return `type-${slug}`
}

const validateConversionAttribute = (
  conversionAttribute: string | undefined,
  attributes: IProductAttribute[]
): void => {
  if (!conversionAttribute) {
    return
  }

  const attr = attributes.find((item) => item.key === conversionAttribute)
  if (!attr) {
    throw buildError(
      400,
      'INVALID_CONVERSION_ATTRIBUTE',
      `conversionAttribute "${conversionAttribute}" no existe en attributes`
    )
  }

  if (attr.type !== 'number') {
    throw buildError(
      400,
      'INVALID_CONVERSION_ATTRIBUTE_TYPE',
      `conversionAttribute "${conversionAttribute}" debe apuntar a un atributo de tipo number`
    )
  }
}

const validateCsvColumns = (
  attributes: IProductAttribute[]
): void => {
  const usedColumns = new Map<number, string>()

  for (const attr of attributes) {
    if (attr.csvColumn === undefined || attr.csvColumn === null) {
      continue
    }

    if (attr.csvColumn < 1 || attr.csvColumn > 10) {
      throw buildError(
        400,
        'INVALID_CSV_COLUMN',
        `csvColumn debe estar entre 1 y 10, recibido: ${attr.csvColumn}`
      )
    }

    const existing = usedColumns.get(attr.csvColumn)
    if (existing) {
      throw buildError(
        400,
        'DUPLICATE_CSV_COLUMN',
        `csvColumn ${attr.csvColumn} usado por "${existing}" y "${attr.key}"`
      )
    }

    usedColumns.set(attr.csvColumn, attr.key)
  }
}

const assignCsvColumns = (attributes: IProductAttribute[]): IProductAttribute[] => {
  const withColumn: IProductAttribute[] = []
  const takenColumns = new Set(
    attributes.filter((a) => a.csvColumn !== undefined).map((a) => a.csvColumn!)
  )

  for (const attr of attributes) {
    if (attr.csvColumn !== undefined) {
      withColumn.push(attr)
      continue
    }

    let nextColumn = 1
    while (takenColumns.has(nextColumn) && nextColumn <= 10) {
      nextColumn++
    }

    if (nextColumn > 10) {
      throw buildError(
        400,
        'TOO_MANY_ATTRIBUTES',
        'Máximo 10 atributos con csvColumn permitido'
      )
    }

    takenColumns.add(nextColumn)
    withColumn.push({ ...attr, csvColumn: nextColumn })
  }

  return withColumn
}

export const createProductType = async (tenantId: string, payload: CreateProductTypeInput): Promise<IProductType> => {
  if (!isValidObjectId(tenantId)) {
    throw buildError(400, 'INVALID_TENANT', 'tenantId inválido')
  }
  if (!payload.name) {
    throw buildError(400, 'NAME_REQUIRED', 'El nombre es requerido')
  }

  const attributes: IProductAttribute[] = (payload.attributes ?? []).map((attr, index) => ({
    key: attr.key,
    label: attr.label,
    type: attr.type,
    required: attr.required,
    options: attr.options,
    defaultValue: attr.defaultValue,
    order: index + 1,
    csvColumn: attr.csvColumn,
    version: 1,
    isDeprecated: false,
    isActive: true,
  }))

  if (attributes.length > 10) {
    throw buildError(400, 'MAX_ATTRIBUTES', 'Máximo 10 atributos permitidos por tipo de producto')
  }

  const attributesWithColumns = assignCsvColumns(attributes)
  validateCsvColumns(attributesWithColumns)
  validateConversionAttribute(payload.conversionAttribute, attributesWithColumns)

  const productType = new ProductType({
    tenantId: new Types.ObjectId(tenantId),
    id: generateProductTypeId(payload.name),
    name: payload.name,
    conversionAttribute: payload.conversionAttribute,
    version: 1,
    isActive: payload.isActive ?? true,
    status: 'draft',
    attributes: attributesWithColumns,
  })

  const saved = await productType.save()
  return saved.toJSON() as IProductType
}

export const listProductTypes = async (tenantId: string): Promise<IProductType[]> => {
  if (!isValidObjectId(tenantId)) {
    throw buildError(400, 'INVALID_TENANT', 'tenantId inválido')
  }

  const types = await ProductType.find({ tenantId: new Types.ObjectId(tenantId), isActive: true })
    .sort({ createdAt: -1 })
    .lean()

  return types as IProductType[]
}

export const getProductTypeById = async (tenantId: string, typeId: string): Promise<IProductType | null> => {
  if (!isValidObjectId(tenantId)) {
    throw buildError(400, 'INVALID_TENANT', 'tenantId inválido')
  }

  const type = await ProductType.findOne({
    tenantId: new Types.ObjectId(tenantId),
    id: typeId,
    isActive: true,
  }).lean()

  return type as IProductType | null
}

export const updateProductType = async (
  tenantId: string,
  typeId: string,
  payload: UpdateProductTypeInput
): Promise<IProductType | null> => {
  if (!isValidObjectId(tenantId)) {
    throw buildError(400, 'INVALID_TENANT', 'tenantId inválido')
  }

  const existing = await ProductType.findOne({
    tenantId: new Types.ObjectId(tenantId),
    id: typeId,
    isActive: true,
  }).lean()

  if (!existing) {
    return null
  }

  const updatePayload: Record<string, unknown> = {}

  if (payload.name !== undefined) {
    updatePayload.name = payload.name
  }
  if (payload.conversionAttribute !== undefined) {
    updatePayload.conversionAttribute = payload.conversionAttribute
  }
  if (payload.isActive !== undefined) {
    updatePayload.isActive = payload.isActive
  }
  if (payload.status !== undefined) {
    updatePayload.status = payload.status
    if (payload.status === 'published') {
      updatePayload.lastPublishedAt = new Date()
      updatePayload.version = existing.version + 1
    }
  }

  if (payload.attributes !== undefined) {
    if (payload.attributes.length > 10) {
      throw buildError(400, 'MAX_ATTRIBUTES', 'Máximo 10 atributos permitidos por tipo de producto')
    }

    const attributes: IProductAttribute[] = payload.attributes.map((attr, index) => {
      const existingAttr = existing.attributes.find((a) => a.key === attr.key)
      const newVersion = existingAttr ? existingAttr.version + 1 : 1

      return {
        key: attr.key,
        label: attr.label,
        type: attr.type,
        required: attr.required,
        options: attr.options,
        defaultValue: attr.defaultValue,
        order: index + 1,
        csvColumn: attr.csvColumn,
        version: newVersion,
        isDeprecated: false,
        isActive: true,
      }
    })

    validateCsvColumns(attributes)
    const attributesWithColumns = assignCsvColumns(attributes)

    updatePayload.attributes = attributesWithColumns

    if (existing.status === 'published') {
      updatePayload.version = existing.version + 1
    }
  }

  const effectiveAttributes = (payload.attributes !== undefined
    ? (updatePayload.attributes as IProductAttribute[])
    : existing.attributes) ?? []
  const effectiveConversionAttribute = payload.conversionAttribute !== undefined
    ? payload.conversionAttribute
    : existing.conversionAttribute

  validateConversionAttribute(effectiveConversionAttribute, effectiveAttributes)

  const updated = await ProductType.findOneAndUpdate(
    { tenantId: new Types.ObjectId(tenantId), id: typeId, isActive: true },
    updatePayload,
    { new: true }
  ).lean()

  return updated as IProductType | null
}

export const deactivateProductType = async (tenantId: string, typeId: string): Promise<boolean> => {
  if (!isValidObjectId(tenantId)) {
    throw buildError(400, 'INVALID_TENANT', 'tenantId inválido')
  }

  const result = await ProductType.findOneAndUpdate(
    { tenantId: new Types.ObjectId(tenantId), id: typeId, isActive: true },
    { isActive: false },
    { new: true }
  ).lean()

  return !!result
}

const BASE_COLUMNS = ['productTypeId', 'productTypeVersion', 'sku', 'ean', 'name', 'category', 'price', 'stock', 'relatedProducts']

const columnLetter = (columnNumber: number): string => {
  let n = columnNumber
  let result = ''

  while (n > 0) {
    const remainder = (n - 1) % 26
    result = String.fromCharCode(65 + remainder) + result
    n = Math.floor((n - 1) / 26)
  }

  return result
}

const escapeSheetNameForFormula = (sheetName: string): string => {
  const escaped = sheetName.replace(/'/g, "''")
  return `'${escaped}'`
}

const getExampleValue = (attr: IProductAttribute): string => {
  if (attr.type === 'select' && attr.options?.length) {
    return attr.options[0]
  }
  if (attr.type === 'multiselect' && attr.options?.length) {
    return attr.options.slice(0, 2).join(';')
  }
  if (attr.type === 'boolean') {
    return 'true'
  }
  if (attr.type === 'number') {
    return '0'
  }
  if (attr.type === 'date') {
    return '2026-01-01'
  }
  return ''
}

export const generateExcelTemplate = async (type: IProductType): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'App'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Template')

  const dynamicAttrs = type.attributes.filter(attr => attr.isActive && !attr.isDeprecated)
  const allColumns = [...BASE_COLUMNS, ...dynamicAttrs.map(attr => attr.key)]

  const headerRow = worksheet.addRow(allColumns)

  headerRow.eachCell(cell => {
    cell.font = { bold: true }
    cell.alignment = { horizontal: 'center' }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    }
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    }
  })

  const exampleValues = [
    type.id,
    type.version.toString(),
    'SKU-001',
    'EAN-001',
    'Producto de ejemplo',
    'Categoría',
    '0',
    '0',
    'SKU-002,SKU-003',
    ...dynamicAttrs.map(attr => getExampleValue(attr)),
  ]

  worksheet.addRow(exampleValues)

  dynamicAttrs.forEach((attr, index) => {
    const colIndex = BASE_COLUMNS.length + index + 1
    const colLetter = worksheet.getColumn(colIndex).letter

    if (attr.type !== 'select' && attr.type !== 'boolean') {
      return
    }

    const options = attr.type === 'boolean' ? ['true', 'false'] : (attr.options ?? [])
    if (options.length === 0) {
      return
    }

    worksheet.dataValidations.add(`${colLetter}2:${colLetter}1000`, {
      type: 'list',
      allowBlank: true,
      formulae: [`"${options.join(',')}"`],
    })
  })

  allColumns.forEach((col, index) => {
    const maxLength = Math.max(
      col.length,
      exampleValues[index]?.toString().length || 0
    )
    worksheet.getColumn(index + 1).width = Math.min(maxLength + 2, 50)
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

export const generateCsvTemplate = (type: IProductType): string => {
  const dynamicAttrs = type.attributes.filter(attr => attr.isActive && !attr.isDeprecated)
  const headers = [...BASE_COLUMNS, ...dynamicAttrs.map(attr => attr.key)]

  const exampleValues = [
    type.id,
    type.version,
    'SKU-001',
    'EAN-001',
    'Producto de ejemplo',
    'Categoría',
    '0',
    '0',
    'SKU-002,SKU-003',
    ...dynamicAttrs.map(attr => getExampleValue(attr)),
  ]

  const escapeCell = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  const headerLine = headers.join(',')
  const dataLine = exampleValues.map(v => escapeCell(String(v))).join(',')

  return `${headerLine}\n${dataLine}`
}

export const generateMultiTypeExcelTemplate = async (
  types: IProductType[]
): Promise<Buffer> => {
  const activeTypes = types.filter(t => t.isActive)
  if (activeTypes.length === 0) {
    throw buildError(400, 'NO_ACTIVE_TYPES', 'No hay tipos de producto activos')
  }

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'App'
  workbook.created = new Date()

  const ROWS_PER_TYPE = 1000

  for (const type of activeTypes) {
    const worksheet = workbook.addWorksheet(type.name.substring(0, 31))

    const dynamicAttrs = type.attributes.filter(attr => attr.isActive && !attr.isDeprecated)
    const allColumns = [...BASE_COLUMNS, ...dynamicAttrs.map(attr => attr.key)]
    const headerRow = worksheet.addRow(allColumns)

    headerRow.eachCell(cell => {
      cell.font = { bold: true }
      cell.alignment = { horizontal: 'center' }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
      }
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    const exampleValues = [
      type.id,
      type.version.toString(),
      'SKU-001',
      'EAN-001',
      'Producto de ejemplo',
      'Categoría',
      '0',
      '0',
      'SKU-002,SKU-003',
      ...dynamicAttrs.map(attr => getExampleValue(attr)),
    ]
    worksheet.addRow(exampleValues)

    dynamicAttrs.forEach((attr, index) => {
      const colIndex = BASE_COLUMNS.length + index + 1
      const colLetter = worksheet.getColumn(colIndex).letter

      if (attr.type !== 'select' && attr.type !== 'boolean') {
        return
      }

      const options = attr.type === 'boolean' ? ['true', 'false'] : (attr.options ?? [])
      if (options.length === 0) {
        return
      }

      worksheet.dataValidations.add(`${colLetter}2:${colLetter}${ROWS_PER_TYPE}`, {
        type: 'list',
        allowBlank: true,
        formulae: [`"${options.join(',')}"`],
      })
    })

    allColumns.forEach((col, index) => {
      const maxLength = Math.max(
        col.length,
        exampleValues[index]?.toString().length || 0
      )
      worksheet.getColumn(index + 1).width = Math.min(maxLength + 2, 50)
    })
  }

  const consolidado = workbook.addWorksheet('Consolidado')

  const consolidadoColumns = ['sku', 'ean', 'name', 'productTypeId', 'productTypeVersion', 'category', 'price', 'stock', 'relatedProducts']
  for (let i = 1; i <= 10; i++) {
    consolidadoColumns.push(`attr_${i}`)
  }

  const headerRow = consolidado.addRow(consolidadoColumns)
  headerRow.eachCell(cell => {
    cell.font = { bold: true }
    cell.alignment = { horizontal: 'center' }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    }
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    }
  })

  let currentRow = 2
  for (const type of activeTypes) {
    const typeSheetName = type.name.substring(0, 31)
    const typeSheet = workbook.getWorksheet(typeSheetName)
    if (!typeSheet) continue

    const dynamicAttrs = type.attributes.filter(attr => attr.isActive && !attr.isDeprecated)
    const attrColumnMap = new Map<string, number>()
    dynamicAttrs.forEach((attr, idx) => {
      attrColumnMap.set(attr.key, BASE_COLUMNS.length + idx + 1)
    })

    const sourceColumnByCsvColumn = new Map<number, number>()
    dynamicAttrs.forEach((attr) => {
      if (attr.csvColumn === undefined) {
        return
      }

      const sourceColumn = attrColumnMap.get(attr.key)
      if (sourceColumn) {
        sourceColumnByCsvColumn.set(attr.csvColumn, sourceColumn)
      }
    })

    const sheetRef = escapeSheetNameForFormula(typeSheetName)

    for (let row = 2; row <= ROWS_PER_TYPE + 1; row++) {
      const consolRow = consolidado.getRow(currentRow)

      const assignFormula = (cellIndex: number, formula: string): void => {
        const cell = consolRow.getCell(cellIndex)
        cell.value = { formula }
        cell.protection = { locked: true }
      }

      assignFormula(1, `IF(${sheetRef}!C${row}="","",${sheetRef}!C${row})`)
      assignFormula(2, `IF(${sheetRef}!D${row}="","",${sheetRef}!D${row})`)
      assignFormula(3, `IF(${sheetRef}!E${row}="","",${sheetRef}!E${row})`)
      assignFormula(4, `IF(${sheetRef}!A${row}="","",${sheetRef}!A${row})`)
      assignFormula(5, `IF(${sheetRef}!B${row}="","",${sheetRef}!B${row})`)
      assignFormula(6, `IF(${sheetRef}!F${row}="","",${sheetRef}!F${row})`)
      assignFormula(7, `IF(${sheetRef}!G${row}="","",${sheetRef}!G${row})`)
      assignFormula(8, `IF(${sheetRef}!H${row}="","",${sheetRef}!H${row})`)
      assignFormula(9, `IF(${sheetRef}!I${row}="","",${sheetRef}!I${row})`)

      for (let csvColumn = 1; csvColumn <= 10; csvColumn++) {
        const targetCellIndex = 9 + csvColumn
        const sourceColumn = sourceColumnByCsvColumn.get(csvColumn)

        if (!sourceColumn) {
          consolRow.getCell(targetCellIndex).value = ''
          continue
        }

        const sourceColumnLetter = columnLetter(sourceColumn)
        assignFormula(
          targetCellIndex,
          `IF(${sheetRef}!${sourceColumnLetter}${row}="","",${sheetRef}!${sourceColumnLetter}${row})`
        )
      }

      consolRow.commit()
      currentRow++
    }
  }

  consolidado.eachRow(row => {
    row.height = 20
  })

  await consolidado.protect('consolidado', {
    selectLockedCells: true,
    selectUnlockedCells: true,
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
