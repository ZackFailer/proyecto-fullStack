import { Types } from 'mongoose'
import { Product } from '../models/product.model.js'
import { InventoryTransfer } from '../models/inventory-transfer.model.js'
import { ProductType } from '../models/product-type.model.js'

export interface TransferDto {
  fromSKU: string
  toSKU: string
  quantity: number
  reason?: string
}

export interface TransferPreviewResult {
  fromSKU: string
  toSKU: string
  quantityFrom: number
  quantityTo: number
  conversionApplied: boolean
  conversionPreview?: {
    fromAttribute: string
    toAttribute: string
    fromValue: number
    toValue: number
  }
}

export interface TransferResult {
  success: boolean
  fromSKU: string
  toSKU: string
  quantityFrom: number
  quantityTo: number
  conversionApplied: boolean
  conversionPreview?: {
    fromAttribute: string
    toAttribute: string
    fromValue: number
    toValue: number
  }
  fromStockAfter: number
  toStockAfter: number
  status: 'completed' | 'failed'
  error?: string
}

export interface PaginatedTransfers {
  items: Array<{
    id: string
    fromSKU: string
    toSKU: string
    quantityFrom: number
    quantityTo: number
    conversionApplied: boolean
    conversionFactor?: {
      fromAttribute: string
      toAttribute: string
      fromValue: number
      toValue: number
    }
    reason?: string
    status: 'pending' | 'completed' | 'failed'
    createdAt: Date
    completedAt?: Date
    error?: string
  }>
  total: number
  page: number
  limit: number
}

const PENDING_TIMEOUT_MS = 30 * 60 * 1000

const EPSILON = 1e-9

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

interface ProductSnapshot {
  _id: Types.ObjectId
  sku: string
  productTypeId: string
  customAttributes?: Record<string, unknown>
  stock: number
}

const resolveTransferQuantity = async (
  tenantObjectId: Types.ObjectId,
  fromProduct: ProductSnapshot,
  toProduct: ProductSnapshot,
  quantityFrom: number
): Promise<{
  quantityTo: number
  conversionApplied: boolean
  conversionFactor?: {
    fromAttribute: string
    toAttribute: string
    fromValue: number
    toValue: number
  }
}> => {
  const [fromType, toType] = await Promise.all([
    ProductType.findOne({
      tenantId: tenantObjectId,
      id: fromProduct.productTypeId,
      isActive: true,
    })
      .select({ conversionAttribute: 1 })
      .lean(),
    ProductType.findOne({
      tenantId: tenantObjectId,
      id: toProduct.productTypeId,
      isActive: true,
    })
      .select({ conversionAttribute: 1 })
      .lean(),
  ])

  const fromAttribute = fromType?.conversionAttribute
  const toAttribute = toType?.conversionAttribute

  if (!fromAttribute || !toAttribute) {
    return {
      quantityTo: quantityFrom,
      conversionApplied: false,
    }
  }

  const fromValue = toNumber(fromProduct.customAttributes?.[fromAttribute])
  const toValue = toNumber(toProduct.customAttributes?.[toAttribute])

  if (fromValue === null || toValue === null || toValue <= 0) {
    throw {
      status: 400,
      code: 'INVALID_CONVERSION_VALUES',
      message: 'Los productos no tienen valores numéricos válidos para conversionAttribute',
      details: {
        fromSKU: fromProduct.sku,
        toSKU: toProduct.sku,
        fromAttribute,
        toAttribute,
      },
    }
  }

  const rawQuantityTo = (quantityFrom * fromValue) / toValue
  const rounded = Math.round(rawQuantityTo)

  if (Math.abs(rawQuantityTo - rounded) > EPSILON) {
    throw {
      status: 400,
      code: 'NON_INTEGER_CONVERSION',
      message: 'La conversión no produce una cantidad entera exacta',
      details: {
        quantityFrom,
        fromAttribute,
        toAttribute,
        fromValue,
        toValue,
        computedQuantityTo: rawQuantityTo,
      },
    }
  }

  return {
    quantityTo: rounded,
    conversionApplied: true,
    conversionFactor: {
      fromAttribute,
      toAttribute,
      fromValue,
      toValue,
    },
  }
}

const getTenantProductsForTransfer = async (
  tenantObjectId: Types.ObjectId,
  dto: TransferDto
): Promise<{ fromProduct: ProductSnapshot; toProduct: ProductSnapshot }> => {
  const fromProduct = await Product.findOne({
    tenantId: tenantObjectId,
    sku: dto.fromSKU,
  }).lean()

  if (!fromProduct) {
    throw { status: 404, code: 'FROM_SKU_NOT_FOUND', message: `Producto origen "${dto.fromSKU}" no encontrado` }
  }

  const toProduct = await Product.findOne({
    tenantId: tenantObjectId,
    sku: dto.toSKU,
  }).lean()

  if (!toProduct) {
    throw { status: 404, code: 'TO_SKU_NOT_FOUND', message: `Producto destino "${dto.toSKU}" no encontrado` }
  }

  return {
    fromProduct: fromProduct as ProductSnapshot,
    toProduct: toProduct as ProductSnapshot,
  }
}

export const previewTransfer = async (
  dto: TransferDto,
  tenantId: string
): Promise<TransferPreviewResult> => {
  const tenantObjectId = new Types.ObjectId(tenantId)

  if (dto.fromSKU === dto.toSKU) {
    throw { status: 400, code: 'INVALID_SAME_SKU', message: 'Origen y destino no pueden ser el mismo SKU' }
  }

  if (!dto.quantity || dto.quantity < 1 || !Number.isInteger(dto.quantity)) {
    throw { status: 400, code: 'INVALID_QUANTITY', message: 'Quantity debe ser un entero positivo' }
  }

  const { fromProduct, toProduct } = await getTenantProductsForTransfer(tenantObjectId, dto)

  const { quantityTo, conversionApplied, conversionFactor } = await resolveTransferQuantity(
    tenantObjectId,
    fromProduct,
    toProduct,
    dto.quantity
  )

  return {
    fromSKU: dto.fromSKU,
    toSKU: dto.toSKU,
    quantityFrom: dto.quantity,
    quantityTo,
    conversionApplied,
    conversionPreview: conversionFactor,
  }
}

export const transferInventory = async (
  dto: TransferDto,
  tenantId: string,
  userId: string
): Promise<TransferResult> => {
  const tenantObjectId = new Types.ObjectId(tenantId)
  const userObjectId = new Types.ObjectId(userId)

  if (dto.fromSKU === dto.toSKU) {
    throw { status: 400, code: 'INVALID_SAME_SKU', message: 'Origen y destino no pueden ser el mismo SKU' }
  }

  if (!dto.quantity || dto.quantity < 1 || !Number.isInteger(dto.quantity)) {
    throw { status: 400, code: 'INVALID_QUANTITY', message: 'Quantity debe ser un entero positivo' }
  }

  const { fromProduct, toProduct } = await getTenantProductsForTransfer(tenantObjectId, dto)

  if (fromProduct.stock < dto.quantity) {
    throw { status: 409, code: 'INSUFFICIENT_STOCK', message: `Stock insuficiente. Disponible: ${fromProduct.stock}` }
  }

  const { quantityTo, conversionApplied, conversionFactor } = await resolveTransferQuantity(
    tenantObjectId,
    fromProduct as ProductSnapshot,
    toProduct as ProductSnapshot,
    dto.quantity
  )

  const transfer = new InventoryTransfer({
    tenantId: tenantObjectId,
    fromSKU: dto.fromSKU,
    toSKU: dto.toSKU,
    quantityFrom: dto.quantity,
    quantityTo,
    conversionApplied,
    conversionFactor,
    userId: userObjectId,
    reason: dto.reason,
    status: 'pending',
  })

  await transfer.save()

  try {
    await executeTransferWithTransaction(
      tenantObjectId,
      fromProduct,
      toProduct,
      dto.quantity,
      quantityTo
    )

    transfer.status = 'completed'
    transfer.completedAt = new Date()
    await transfer.save()

    const updatedFrom = await Product.findById(fromProduct._id).lean()
    const updatedTo = await Product.findById(toProduct._id).lean()

    return {
      success: true,
      fromSKU: dto.fromSKU,
      toSKU: dto.toSKU,
      quantityFrom: dto.quantity,
      quantityTo,
      conversionApplied,
      conversionPreview: conversionFactor,
      fromStockAfter: updatedFrom?.stock ?? 0,
      toStockAfter: updatedTo?.stock ?? 0,
      status: 'completed',
    }
  } catch (error) {
    const isTransactionNotSupported =
      error.message?.includes('Transaction numbers are only allowed') ||
      error.message?.includes('transaction')

    if (isTransactionNotSupported) {
      return await executeTransferFallback(
        tenantObjectId,
        fromProduct,
        toProduct,
        dto.quantity,
        quantityTo,
        transfer
      )
    }

    transfer.status = 'failed'
    transfer.error = (error as Error).message
    transfer.completedAt = new Date()
    await transfer.save()

    return {
      success: false,
      fromSKU: dto.fromSKU,
      toSKU: dto.toSKU,
      quantityFrom: dto.quantity,
      quantityTo,
      conversionApplied,
      conversionPreview: conversionFactor,
      fromStockAfter: fromProduct.stock,
      toStockAfter: toProduct.stock,
      status: 'failed',
      error: (error as Error).message,
    }
  }
}

const executeTransferWithTransaction = async (
  tenantObjectId: Types.ObjectId,
  fromProduct: ProductSnapshot,
  toProduct: ProductSnapshot,
  quantityFrom: number,
  quantityTo: number
): Promise<void> => {
  const session = await Product.db.client.startSession()
  try {
    await session.withTransaction(async () => {
      await Product.updateOne(
        { _id: fromProduct._id, tenantId: tenantObjectId, stock: { $gte: quantityFrom } },
        { $inc: { stock: -quantityFrom } },
        { session }
      )

      await Product.updateOne(
        { _id: toProduct._id, tenantId: tenantObjectId },
        { $inc: { stock: quantityTo } },
        { session }
      )
    })
  } finally {
    session.endSession()
  }
}

const executeTransferFallback = async (
  tenantObjectId: Types.ObjectId,
  fromProduct: ProductSnapshot,
  toProduct: ProductSnapshot,
  quantityFrom: number,
  quantityTo: number,
  transfer: InstanceType<typeof InventoryTransfer>
): Promise<TransferResult> => {
  const fromFilter = { _id: fromProduct._id, tenantId: tenantObjectId, stock: { $gte: quantityFrom } }
  const fromUpdate = { $inc: { stock: -quantityFrom } }

  const resultFrom = await Product.updateOne(fromFilter, fromUpdate)
  if (resultFrom.modifiedCount === 0) {
    const product = await Product.findById(fromProduct._id).lean()
    const available = product?.stock ?? 0

    transfer.status = 'failed'
    transfer.error = `Stock insuficiente. Disponible: ${available}`
    transfer.completedAt = new Date()
    await transfer.save()

    return {
      success: false,
      fromSKU: fromProduct.sku,
      toSKU: toProduct.sku,
      quantityFrom,
      quantityTo,
      conversionApplied: false,
      fromStockAfter: available,
      toStockAfter: toProduct.stock,
      status: 'failed',
      error: `Stock insuficiente. Disponible: ${available}`,
    }
  }

  try {
    await Product.updateOne(
      { _id: toProduct._id, tenantId: tenantObjectId },
      { $inc: { stock: quantityTo } }
    )
  } catch (compensationError) {
    await Product.updateOne(
      { _id: fromProduct._id, tenantId: tenantObjectId },
      { $inc: { stock: quantityFrom } }
    )

    transfer.status = 'failed'
    transfer.error = (compensationError as Error).message
    transfer.completedAt = new Date()
    await transfer.save()

    return {
      success: false,
      fromSKU: fromProduct.sku,
      toSKU: toProduct.sku,
      quantityFrom,
      quantityTo,
      conversionApplied: false,
      fromStockAfter: fromProduct.stock,
      toStockAfter: toProduct.stock,
      status: 'failed',
      error: (compensationError as Error).message,
    }
  }

  transfer.status = 'completed'
  transfer.completedAt = new Date()
  await transfer.save()

  const updatedFrom = await Product.findById(fromProduct._id).lean()
  const updatedTo = await Product.findById(toProduct._id).lean()

  return {
    success: true,
    fromSKU: fromProduct.sku,
    toSKU: toProduct.sku,
    quantityFrom,
    quantityTo,
    conversionApplied: false,
    fromStockAfter: updatedFrom?.stock ?? 0,
    toStockAfter: updatedTo?.stock ?? 0,
    status: 'completed',
  }
}

export const getTransferHistory = async (
  tenantId: string,
  sku?: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedTransfers> => {
  const tenantObjectId = new Types.ObjectId(tenantId)
  const skip = (page - 1) * limit

  const filter: Record<string, unknown> = { tenantId: tenantObjectId }
  if (sku) {
    filter.$or = [{ fromSKU: sku }, { toSKU: sku }]
  }

  const [items, total] = await Promise.all([
    InventoryTransfer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InventoryTransfer.countDocuments(filter),
  ])

  return {
    items: items.map((t) => ({
      id: t._id.toString(),
      fromSKU: t.fromSKU,
      toSKU: t.toSKU,
      quantityFrom: t.quantityFrom,
      quantityTo: t.quantityTo,
      conversionApplied: t.conversionApplied,
      conversionFactor: t.conversionFactor,
      reason: t.reason,
      status: t.status,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
      error: t.error,
    })),
    total,
    page,
    limit,
  }
}

export const cleanupPendingTransfers = async (): Promise<number> => {
  const cutoff = new Date(Date.now() - PENDING_TIMEOUT_MS)

  const result = await InventoryTransfer.updateMany(
    { status: 'pending', createdAt: { $lt: cutoff } },
    { $set: { status: 'failed', error: 'timeout', completedAt: new Date() } }
  )

  return result.modifiedCount
}
