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
    version: 1,
    isDeprecated: false,
    isActive: true,
  }))

  if (attributes.length > 10) {
    throw buildError(400, 'MAX_ATTRIBUTES', 'Máximo 10 atributos permitidos por tipo de producto')
  }

  validateConversionAttribute(payload.conversionAttribute, attributes)

  const productType = new ProductType({
    tenantId: new Types.ObjectId(tenantId),
    id: generateProductTypeId(payload.name),
    name: payload.name,
    conversionAttribute: payload.conversionAttribute,
    version: 1,
    isActive: payload.isActive ?? true,
    status: 'draft',
    attributes,
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
        version: newVersion,
        isDeprecated: false,
        isActive: true,
      }
    })

    updatePayload.attributes = attributes

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

const BASE_COLUMNS = ['productTypeId', 'productTypeVersion', 'sku', 'ean', 'name', 'category', 'price', 'stock']

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
