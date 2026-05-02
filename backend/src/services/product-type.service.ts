import { isValidObjectId, Types } from 'mongoose'
import { IProductType, IProductAttribute, ProductType, ProductAttributeType } from '../models/product-type.model.js'

export interface ServiceError extends Error {
  status?: number
  code?: string
  details?: unknown
}

export interface CreateProductTypeInput {
  name: string
  isActive?: boolean
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

  const productType = new ProductType({
    tenantId: new Types.ObjectId(tenantId),
    id: generateProductTypeId(payload.name),
    name: payload.name,
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