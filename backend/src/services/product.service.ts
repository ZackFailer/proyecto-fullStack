import { isValidObjectId, Types } from 'mongoose'
import { Product, IProduct } from '../models/product.model.js'
import { ProductType } from '../models/product-type.model.js'

export interface ServiceError extends Error {
  status?: number
  code?: string
  details?: unknown
}

export interface CreateProductInput {
  tenantId: string
  productTypeId: string
  productTypeVersion: number
  sku: string
  ean?: string
  name: string
  description?: string
  price: number
  stock: number
  category: string
  customAttributes?: Record<string, unknown>
  status?: 'active' | 'inactive'
}

export interface UpdateProductInput {
  name?: string
  description?: string
  price?: number
  stock?: number
  category?: string
  status?: 'active' | 'inactive'
  customAttributes?: Record<string, unknown>
}

export interface ListProductsFilters {
  tenantId: string
  productTypeId?: string
  category?: string
  status?: 'active' | 'inactive'
  search?: string
  page?: number
  limit?: number
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

export const createProduct = async (input: CreateProductInput): Promise<IProduct> => {
  if (!isValidObjectId(input.tenantId)) {
    throw buildError(400, 'INVALID_TENANT', 'tenantId inválido')
  }

  const productType = await ProductType.findOne({
    tenantId: new Types.ObjectId(input.tenantId),
    id: input.productTypeId,
    isActive: true,
  }).lean()

  if (!productType) {
    throw buildError(400, 'INVALID_PRODUCT_TYPE', 'Tipo de producto no encontrado')
  }

  if (productType.version !== input.productTypeVersion) {
    throw buildError(400, 'INVALID_PRODUCT_TYPE_VERSION', 'La versión del tipo de producto no coincide')
  }

  const existingBySku = await Product.findOne({
    tenantId: new Types.ObjectId(input.tenantId),
    sku: input.sku,
  }).lean()

  if (existingBySku) {
    throw buildError(400, 'DUPLICATE_SKU', 'El SKU ya existe en este tenant')
  }

  if (input.ean) {
    const existingByEan = await Product.findOne({
      tenantId: new Types.ObjectId(input.tenantId),
      ean: input.ean,
    }).lean()

    if (existingByEan) {
      throw buildError(400, 'DUPLICATE_EAN', 'El EAN ya existe en este tenant')
    }
  }

  const product = new Product({
    tenantId: new Types.ObjectId(input.tenantId),
    productTypeId: input.productTypeId,
    productTypeVersion: input.productTypeVersion,
    sku: input.sku,
    ean: input.ean,
    name: input.name,
    description: input.description,
    price: input.price,
    stock: input.stock,
    category: input.category,
    status: input.status ?? 'active',
    customAttributes: input.customAttributes ?? {},
  })

  const saved = await product.save()
  return saved.toJSON() as IProduct
}

export const listProducts = async (filters: ListProductsFilters): Promise<{
  items: IProduct[]
  page: number
  limit: number
  total: number
}> => {
  if (!isValidObjectId(filters.tenantId)) {
    throw buildError(400, 'INVALID_TENANT', 'tenantId inválido')
  }

  const page = Math.max(1, Number(filters.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20))

  const query: Record<string, unknown> = {
    tenantId: new Types.ObjectId(filters.tenantId),
  }

  if (filters.productTypeId) {
    query.productTypeId = filters.productTypeId
  }
  if (filters.category) {
    query.category = filters.category
  }
  if (filters.status) {
    query.status = filters.status
  }
  if (filters.search) {
    const regex = new RegExp(filters.search, 'i')
    query.$or = [{ name: regex }, { sku: regex }]
  }

  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(query),
  ])

  return {
    items: items as IProduct[],
    page,
    limit,
    total,
  }
}

export const getProductById = async (tenantId: string, id: string): Promise<IProduct | null> => {
  if (!isValidObjectId(tenantId)) {
    throw buildError(400, 'INVALID_TENANT', 'tenantId inválido')
  }

  if (!isValidObjectId(id)) {
    throw buildError(400, 'INVALID_ID', 'ID inválido')
  }

  const product = await Product.findOne({
    _id: new Types.ObjectId(id),
    tenantId: new Types.ObjectId(tenantId),
  }).lean()

  return product as IProduct | null
}

export const updateProduct = async (
  tenantId: string,
  id: string,
  updates: UpdateProductInput
): Promise<IProduct | null> => {
  if (!isValidObjectId(tenantId)) {
    throw buildError(400, 'INVALID_TENANT', 'tenantId inválido')
  }

  if (!isValidObjectId(id)) {
    throw buildError(400, 'INVALID_ID', 'ID inválido')
  }

  if (updates.sku) {
    const existingBySku = await Product.findOne({
      tenantId: new Types.ObjectId(tenantId),
      sku: updates.sku,
      _id: { $ne: new Types.ObjectId(id) },
    }).lean()

    if (existingBySku) {
      throw buildError(400, 'DUPLICATE_SKU', 'El SKU ya existe en este tenant')
    }
  }

  if (updates.ean) {
    const existingByEan = await Product.findOne({
      tenantId: new Types.ObjectId(tenantId),
      ean: updates.ean,
      _id: { $ne: new Types.ObjectId(id) },
    }).lean()

    if (existingByEan) {
      throw buildError(400, 'DUPLICATE_EAN', 'El EAN ya existe en este tenant')
    }
  }

  const product = await Product.findOneAndUpdate(
    { _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) },
    updates,
    { new: true }
  ).lean()

  return product as IProduct | null
}