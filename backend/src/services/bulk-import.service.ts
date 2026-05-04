import { Types } from 'mongoose'
import { BulkProcess, IBulkProcess } from '../models/bulk-process.model.js'
import { BulkSubProcess, IBulkSubProcess } from '../models/bulk-subprocess.model.js'
import { ItemProcessLog, IItemProcessLog } from '../models/item-process-log.model.js'
import { Product, IProduct } from '../models/product.model.js'
import { ProductType, IProductType } from '../models/product-type.model.js'

export interface ServiceError extends Error {
  status?: number
  code?: string
  details?: unknown
}

export type RowAction = 'created' | 'updated' | 'reactivated' | 'deactivated' | 'deleted' | 'error'
type CsvAction = 'active' | 'inactive' | 'deleted'

export interface ParsedRow {
  rowNumber: number
  data: Record<string, string>
  originalData: Record<string, string>
  action: CsvAction
  invalidAction?: string
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface BulkImportResult {
  success: boolean
  processId: string
  message: string
}

const SKU_MAX_LENGTH = 64
const SKU_ALLOWED_REGEX = /^[A-Za-z0-9._-]+$/

/**
 * Allowed relationship types per product model.
 */
const ALLOWED_RELATION_TYPES = ['derived-from', 'component-of', 'variant-of', 'related'] as const
type AllowedRelationType = typeof ALLOWED_RELATION_TYPES[number]

/**
 * Result of parsing relatedProducts from a CSV cell.
 */
export interface ParsedRelatedProducts {
  entries: Array<{ sku: string; type: AllowedRelationType }>
  warnings: Array<{ entry: string; reason: string }>
}

/**
 * Parse relatedProducts from a CSV cell value.
 * Format: SKU,SKU,SKU (e.g., "SKU-002,SKU-003")
 * Each entry is a SKU. If an entry contains ":", it's treated as deprecated syntax.
 * Default relation type is "related".
 */
export const parseRelatedProductsFromCell = (cellValue: string): ParsedRelatedProducts => {
  const entries: Array<{ sku: string; type: AllowedRelationType }> = []
  const warnings: Array<{ entry: string; reason: string }> = []

  if (!cellValue || cellValue.trim() === '') {
    return { entries, warnings }
  }

  const rawEntries = cellValue.split(',').map((e) => e.trim()).filter(Boolean)

  const seenSkus = new Set<string>()

  for (const rawEntry of rawEntries) {
    // Check for deprecated typed syntax (contains ":")
    if (rawEntry.includes(':')) {
      warnings.push({ entry: rawEntry, reason: 'Sintaxis obsoleta (contiene tipo). Solo se usará el SKU.' })
      const colonIndex = rawEntry.lastIndexOf(':')
      const sku = rawEntry.substring(0, colonIndex).trim()
      if (!sku || !SKU_ALLOWED_REGEX.test(sku)) {
        warnings.push({ entry: rawEntry, reason: 'SKU con caracteres inválidos' })
        continue
      }
      if (seenSkus.has(sku)) {
        warnings.push({ entry: rawEntry, reason: 'SKU duplicado en la misma celda' })
        continue
      }
      seenSkus.add(sku)
      entries.push({ sku, type: 'related' })
      continue
    }

    // Simple SKU format
    const sku = rawEntry.trim()

    if (!sku) {
      warnings.push({ entry: rawEntry, reason: 'SKU vacío' })
      continue
    }

    if (!SKU_ALLOWED_REGEX.test(sku)) {
      warnings.push({ entry: rawEntry, reason: 'SKU con caracteres inválidos' })
      continue
    }

    if (seenSkus.has(sku)) {
      warnings.push({ entry: rawEntry, reason: 'SKU duplicado en la misma celda' })
      continue
    }
    seenSkus.add(sku)

    entries.push({ sku, type: 'related' })
  }

  return { entries, warnings }
}

/**
 * Validate relatedProducts for self-reference and prepare for resolution.
 * Returns warnings for any self-references found.
 */
export const validateRelatedProductsForImport = (
  entries: Array<{ sku: string; type: AllowedRelationType }>,
  sourceSku: string
): { validEntries: Array<{ sku: string; type: AllowedRelationType }>; warnings: Array<{ entry: string; reason: string }> } => {
  const validEntries: Array<{ sku: string; type: AllowedRelationType }> = []
  const warnings: Array<{ entry: string; reason: string }> = []

  for (const entry of entries) {
    if (entry.sku.toLowerCase() === sourceSku.toLowerCase()) {
      warnings.push({ entry: `${entry.sku}:${entry.type}`, reason: 'Autorreferencia' })
      continue
    }
    validEntries.push(entry)
  }

  return { validEntries, warnings }
}

/**
 * Resolve related product SKUs against existing database products and
 * SKUs imported in the current batch.
 * Returns resolved entries and warnings for unresolved SKUs.
 */
export const resolveRelatedProducts = async (
  tenantId: string,
  entries: Array<{ sku: string; type: AllowedRelationType }>,
  importedSkusInBatch: Set<string>
): Promise<{
  resolved: Array<{ sku: string; type: AllowedRelationType }>;
  unresolvedWarnings: Array<{ entry: string; reason: string }>;
}> => {
  const resolved: Array<{ sku: string; type: AllowedRelationType }> = []
  const unresolvedWarnings: Array<{ entry: string; reason: string }> = []

  // Collect all SKUs to look up (both from DB and from current batch)
  const skusToResolve = entries.map((e) => e.sku)
  const skusToQuery = skusToResolve.filter((sku) => !importedSkusInBatch.has(sku))

  // Query existing products from DB
  let existingProducts: Array<{ sku: string }> = []
  if (skusToQuery.length > 0) {
    existingProducts = await Product.find(
      {
        tenantId: new Types.ObjectId(tenantId),
        sku: { $in: skusToQuery },
        status: 'active',
      },
      { sku: 1 }
    ).lean()
  }

  const existingSkuSet = new Set(existingProducts.map((p) => p.sku))

  // Resolve each entry
  for (const entry of entries) {
    // Check if SKU exists in DB or was imported in this batch
    const existsInDb = existingSkuSet.has(entry.sku)
    const importedInBatch = importedSkusInBatch.has(entry.sku)

    if (existsInDb || importedInBatch) {
      resolved.push(entry)
    } else {
      unresolvedWarnings.push({
        entry: `${entry.sku}:${entry.type}`,
        reason: 'SKU no encontrado',
      })
    }
  }

  return { resolved, unresolvedWarnings }
}

export const determineProcessOutcome = (
  successCount: number,
  errorCount: number
): { status: 'completed' | 'failed' | 'partial'; errorSummary?: string } => {
  if (errorCount === 0) {
    return { status: 'completed' }
  }

  if (successCount === 0) {
    return { status: 'failed', errorSummary: 'Todos los productos fallaron la validación' }
  }

  return { status: 'partial', errorSummary: `${errorCount} productos con errores` }
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

const detectDelimiter = (line: string): string => {
  const commaCount = (line.match(/,/g) || []).length
  const semicolonCount = (line.match(/;/g) || []).length
  return semicolonCount > commaCount ? ';' : ','
}

const normalizeAction = (action: string | undefined): CsvAction | undefined => {
  if (!action) return 'active'
  const normalized = action.toLowerCase().trim()
  if (normalized === 'active' || normalized === 'inactive' || normalized === 'deleted') {
    return normalized
  }
  return undefined
}

const getRowValue = (row: ParsedRow, key: string): string => {
  const direct = row.data[key]
  if (typeof direct === 'string') {
    return direct
  }

  const target = key.toLowerCase()
  for (const [header, value] of Object.entries(row.data)) {
    if (header.toLowerCase() === target) {
      return value
    }
  }

  return ''
}

/**
 * Parse a single CSV line with support for:
 * - Quoted cells containing commas
 * - Escaped quotes (double quotes inside quoted cells)
 * - Different delimiters (comma, semicolon, tab)
 */
const parseCsvLine = (line: string, delimiter: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote - add one quote and skip next
          current += '"'
          i += 2
        } else {
          // End of quoted section
          inQuotes = false
          i++
        }
      } else {
        current += char
        i++
      }
    } else {
      if (char === '"') {
        // Start of quoted section
        inQuotes = true
        i++
      } else if (char === delimiter) {
        // End of current field
        result.push(current.trim())
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }
  }

  // Add the last field
  result.push(current.trim())

  return result
}

/**
 * Detect if a line contains quoted cells by checking for unescaped quotes pattern.
 * Used to improve delimiter detection accuracy.
 */
const hasQuotedCells = (line: string): boolean => {
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote, skip next
        i++
      } else {
        inQuotes = !inQuotes
      }
    }
  }
  return inQuotes
}

/**
 * Detect delimiter, accounting for quoted cells that may contain the candidate delimiter.
 */
const detectDelimiterWithQuotes = (line: string): string => {
  const candidates = [',', ';', '\t']

  // First try the simple count
  const commaCount = (line.match(/,/g) || []).length
  const semicolonCount = (line.match(/;/g) || []).length

  if (semicolonCount > commaCount) {
    return ';'
  }
  return ','
}

export const parseCSV = (content: string): ParsedRow[] => {
  const lines = content.trim().split(/\r?\n/)
  if (lines.length < 2) {
    throw buildError(400, 'INVALID_CSV', 'El CSV debe tener al menos una fila de datos')
  }

  const delimiter = detectDelimiterWithQuotes(lines[0])

  // Parse headers with quote support
  const headers = parseCsvLine(lines[0], delimiter).map((h) => h.trim())
  const rows: ParsedRow[] = []

  const actionIndex = headers.findIndex((h) => h.toLowerCase() === 'action')

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCsvLine(line, delimiter)
    const data: Record<string, string> = {}
    const originalData: Record<string, string> = {}

    headers.forEach((header, index) => {
      const value = values[index]?.trim() ?? ''
      data[header] = value
      originalData[header] = value
    })

    const actionValue = actionIndex >= 0 ? values[actionIndex]?.trim() : undefined
    const normalizedAction = normalizeAction(actionValue)

    rows.push({
      rowNumber: i + 1,
      data,
      originalData,
      action: normalizedAction ?? 'active',
      invalidAction: actionValue && !normalizedAction ? actionValue : undefined,
    })
  }

  return rows
}

export const detectDuplicateSKUs = (rows: ParsedRow[]): Map<string, number[]> => {
  const skuMap = new Map<string, number[]>()

  for (const row of rows) {
    const sku = getRowValue(row, 'sku').trim()
    if (!sku) continue

    const existing = skuMap.get(sku) || []
    existing.push(row.rowNumber)
    skuMap.set(sku, existing)
  }

  const duplicates = new Map<string, number[]>()
  skuMap.forEach((rowNumbers, sku) => {
    if (rowNumbers.length > 1) {
      duplicates.set(sku, rowNumbers)
    }
  })

  return duplicates
}

export const detectDuplicateEANs = (rows: ParsedRow[]): Map<string, number[]> => {
  const eanMap = new Map<string, number[]>()

  for (const row of rows) {
    const ean = getRowValue(row, 'ean').trim()
    if (!ean) continue

    const existing = eanMap.get(ean) || []
    existing.push(row.rowNumber)
    eanMap.set(ean, existing)
  }

  const duplicates = new Map<string, number[]>()
  eanMap.forEach((rowNumbers, ean) => {
    if (rowNumbers.length > 1) {
      duplicates.set(ean, rowNumbers)
    }
  })

  return duplicates
}

export const validateRow = (
  row: ParsedRow,
  productType: IProductType,
  existingProduct?: IProduct | null
): { isValid: boolean; errors: ValidationError[]; productData?: Partial<IProduct>; action?: RowAction } => {
  const errors: ValidationError[] = []
  const action = row.action

  if (row.invalidAction) {
    errors.push({ field: 'action', message: `Valor de acción inválido: ${row.invalidAction}`, code: 'INVALID_ACTION' })
  }

  const sku = getRowValue(row, 'sku').trim()
  if (!sku) {
    errors.push({ field: 'sku', message: 'sku es requerido', code: 'MISSING_FIELD' })
  } else {
    if (sku.length > SKU_MAX_LENGTH) {
      errors.push({ field: 'sku', message: `sku no puede superar ${SKU_MAX_LENGTH} caracteres`, code: 'INVALID_LENGTH' })
    }
    if (!SKU_ALLOWED_REGEX.test(sku)) {
      errors.push({ field: 'sku', message: 'sku contiene caracteres inválidos', code: 'INVALID_FORMAT' })
    }
  }

  const isUpdate = !!existingProduct
  const isReactivation = existingProduct && existingProduct.status === 'inactive'

  if ((action === 'inactive' || action === 'deleted') && !existingProduct) {
    errors.push({ field: 'action', message: `No se puede ${action === 'inactive' ? 'desactivar' : 'eliminar'} un producto inexistente`, code: 'ACTION_ON_NONEXISTENT' })
  }

  if (!isUpdate) {
    const productTypeId = getRowValue(row, 'productTypeId')
    if (!productTypeId) {
      errors.push({ field: 'productTypeId', message: 'productTypeId es requerido', code: 'MISSING_FIELD' })
    }

    const name = getRowValue(row, 'name')
    if (!name) {
      errors.push({ field: 'name', message: 'name es requerido', code: 'MISSING_FIELD' })
    }

    const priceStr = getRowValue(row, 'price')
    const price = priceStr ? parseFloat(priceStr) : NaN
    if (isNaN(price)) {
      errors.push({ field: 'price', message: 'price debe ser un número', code: 'INVALID_TYPE' })
    }

    const stockStr = getRowValue(row, 'stock')
    const stock = stockStr ? parseFloat(stockStr) : 0
    if (isNaN(stock)) {
      errors.push({ field: 'stock', message: 'stock debe ser un número', code: 'INVALID_TYPE' })
    }

    const category = getRowValue(row, 'category')
    if (!category) {
      errors.push({ field: 'category', message: 'category es requerido', code: 'MISSING_FIELD' })
    }
  }

  const eanValue = getRowValue(row, 'ean').trim()
  const ean = eanValue.length > 0 ? eanValue : null

  const detectedFormat = detectCsvFormat(Object.keys(row.data))
  const mappedAttributes = mapRowToAttributes(row.data, detectedFormat.format, productType)

  const customAttributes: Record<string, unknown> = {}
  for (const attr of productType.attributes) {
    if (!attr.isActive || attr.isDeprecated) continue

    if (detectedFormat.format === 'multi-type' && attr.csvColumn === undefined) {
      continue
    }

    const mappedValue = mappedAttributes[attr.key]
    const hasMappedValue =
      mappedValue !== undefined &&
      mappedValue !== null &&
      !(typeof mappedValue === 'string' && mappedValue.trim().length === 0)

    const value = getRowValue(row, attr.key)
    const hasValue = value && value.trim().length > 0

    if (!isUpdate && attr.required && !hasMappedValue && !hasValue) {
      errors.push({ field: attr.key, message: `${attr.label} es requerido`, code: 'MISSING_REQUIRED_FIELD' })
      continue
    }

    if (hasMappedValue) {
      customAttributes[attr.key] = mappedValue
      continue
    }

    if (hasValue) {
      if (attr.type === 'number') {
        const numValue = parseFloat(value)
        if (isNaN(numValue)) {
          errors.push({ field: attr.key, message: `${attr.label} debe ser un número`, code: 'INVALID_TYPE' })
        } else {
          customAttributes[attr.key] = numValue
        }
      } else if (attr.type === 'boolean') {
        const boolValue = value.toLowerCase().trim()
        const validBooleanValues = ['true', 'false', '1', '0']
        if (!validBooleanValues.includes(boolValue)) {
          errors.push({ field: attr.key, message: `${attr.label} debe ser true, false, 1 o 0`, code: 'INVALID_TYPE' })
        } else {
          customAttributes[attr.key] = boolValue === 'true' || boolValue === '1'
        }
      } else if (attr.type === 'date') {
        const dateStr = value.trim()
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!isoDateRegex.test(dateStr)) {
          errors.push({ field: attr.key, message: `${attr.label} debe tener formato YYYY-MM-DD`, code: 'INVALID_TYPE' })
        } else {
          const [year, month, day] = dateStr.split('-').map(Number)
          const monthDays = [31, year % 4 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
          if (month < 1 || month > 12 || day < 1 || day > monthDays[month - 1]) {
            errors.push({ field: attr.key, message: `${attr.label} contiene una fecha inválida`, code: 'INVALID_TYPE' })
          } else {
            const dateValue = new Date(dateStr)
            customAttributes[attr.key] = dateValue.toISOString()
          }
        }
      } else if ((attr.type === 'select' || attr.type === 'multiselect') && attr.options) {
        if (attr.type === 'select') {
          if (!attr.options.includes(value)) {
            errors.push({ field: attr.key, message: `${attr.label} debe ser uno de: ${attr.options.join(', ')}`, code: 'INVALID_OPTION' })
          } else {
            customAttributes[attr.key] = value
          }
        } else {
          const values = value.split(';').map((v) => v.trim())
          const invalidOptions = values.filter((v) => !attr.options!.includes(v))
          if (invalidOptions.length > 0) {
            errors.push({ field: attr.key, message: `${attr.label} contiene opciones inválidas: ${invalidOptions.join(', ')}`, code: 'INVALID_OPTION' })
          } else {
            customAttributes[attr.key] = values
          }
        }
      } else {
        customAttributes[attr.key] = value
      }
    } else if (attr.defaultValue !== undefined) {
      customAttributes[attr.key] = attr.defaultValue
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors, action: 'error' }
  }

  const productData: Partial<IProduct> = {}

  if (!isUpdate) {
    productData.productTypeId = productType.id
    productData.productTypeVersion = productType.version
    productData.sku = getRowValue(row, 'sku')
    productData.name = getRowValue(row, 'name')
    productData.price = parseFloat(getRowValue(row, 'price')) || 0
    productData.stock = parseFloat(getRowValue(row, 'stock')) || 0
    productData.category = getRowValue(row, 'category')
  }

  const rowName = getRowValue(row, 'name')
  const rowPrice = getRowValue(row, 'price')
  const rowStock = getRowValue(row, 'stock')
  const rowCategory = getRowValue(row, 'category')

  if (rowName) productData.name = rowName
  if (rowPrice) productData.price = parseFloat(rowPrice)
  if (rowStock) productData.stock = parseFloat(rowStock)
  if (rowCategory) productData.category = rowCategory
  if (isUpdate) {
    if (ean) {
      productData.ean = ean
    }
  } else {
    productData.ean = ean
  }
  if (Object.keys(customAttributes).length > 0) {
    productData.customAttributes = isUpdate
      ? { ...(existingProduct?.customAttributes ?? {}), ...customAttributes }
      : customAttributes
  }

  let finalAction: RowAction = isReactivation ? 'reactivated' : (isUpdate ? 'updated' : 'created')

  if (action === 'inactive' || action === 'deleted') {
    productData.status = 'inactive'
    finalAction = action === 'deleted' ? 'deleted' : 'deactivated'
  } else if (isReactivation) {
    productData.status = 'active'
    finalAction = 'reactivated'
  } else if (isUpdate && existingProduct?.status !== 'active') {
    productData.status = 'active'
    finalAction = 'reactivated'
  }

  return {
    isValid: true,
    errors: [],
    productData,
    action: finalAction,
  }
}

export const startBulkImport = async (
  tenantId: string,
  initiatedBy: string,
  fileName: string,
  fileSize: number,
  csvContent: string
): Promise<BulkImportResult> => {
  const tenantObjectId = new Types.ObjectId(tenantId)

  const existingProcess = await BulkProcess.findOne({
    tenantId: tenantObjectId,
    status: 'processing',
  }).lean()

  if (existingProcess) {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    if (existingProcess.updatedAt && existingProcess.updatedAt < thirtyMinutesAgo) {
      existingProcess.status = 'failed'
      existingProcess.errorSummary = 'timeout'
      existingProcess.completedAt = new Date()
      await BulkProcess.updateOne({ _id: existingProcess._id }, { status: 'failed', errorSummary: 'timeout', completedAt: new Date() })
    } else {
      throw buildError(409, 'CONCURRENT_IMPORT', 'Ya hay una importación en progreso para este tenant')
    }
  }

  const process = new BulkProcess({
    tenantId: tenantObjectId,
    initiatedBy: new Types.ObjectId(initiatedBy),
    fileName,
    fileSize,
    fileContent: csvContent,
    status: 'processing',
    totalItems: 0,
    processedItems: 0,
    successItems: 0,
    errorItems: 0,
    startedAt: new Date(),
  })

  try {
    await process.save()
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      throw buildError(409, 'CONCURRENT_IMPORT', 'Ya hay una importación en progreso para este tenant')
    }
    throw error
  }

  setImmediate(() => {
    executeBulkImport(process.id, tenantId).catch(console.error)
  })

  return {
    success: true,
    processId: process.id,
    message: 'Importación iniciada',
  }
}

const executeBulkImport = async (processId: string, tenantId: string): Promise<void> => {
  try {
    const process = await BulkProcess.findById(processId).select('+fileContent')
    if (!process || !process.fileContent) {
      process!.status = 'failed'
      process!.errorSummary = 'Contenido del archivo no encontrado'
      process!.completedAt = new Date()
      await process!.save()
      return
    }

    const uploadSubprocess = new BulkSubProcess({
      processId,
      step: 'upload',
      status: 'completed',
      startedAt: process.startedAt,
      completedAt: new Date(),
      durationMs: 0,
    })
    await uploadSubprocess.save()

    const parsingStart = new Date()
    const parsingSubprocess = new BulkSubProcess({
      processId,
      step: 'parsing',
      status: 'in_progress',
      startedAt: parsingStart,
    })
    await parsingSubprocess.save()

    let rows: ParsedRow[]
    try {
      rows = parseCSV(process.fileContent)
    } catch (error) {
      parsingSubprocess.status = 'failed'
      parsingSubprocess.errorMessage = (error as Error).message
      parsingSubprocess.completedAt = new Date()
      parsingSubprocess.durationMs = Date.now() - parsingStart.getTime()
      await parsingSubprocess.save()

      process.status = 'failed'
      process.errorSummary = 'Error al parsear CSV'
      process.completedAt = new Date()
      await process.save()
      return
    }

    parsingSubprocess.status = 'completed'
    parsingSubprocess.completedAt = new Date()
    parsingSubprocess.durationMs = Date.now() - parsingStart.getTime()
    await parsingSubprocess.save()

    process.totalItems = rows.length
    await process.save()

    const productTypes = await ProductType.find({ tenantId: new Types.ObjectId(tenantId), isActive: true }).lean()
    const productTypeById = new Map(productTypes.map((pt) => [pt.id!, pt]))
    const productTypeByObjectId = new Map(productTypes.map((pt) => [pt._id.toString(), pt]))

    const findProductType = (productTypeId: string): IProductType | undefined => {
      return productTypeById.get(productTypeId) || productTypeByObjectId.get(productTypeId)
    }

    const validationStart = new Date()
    const validationSubprocess = new BulkSubProcess({
      processId,
      step: 'validation',
      status: 'in_progress',
      startedAt: validationStart,
    })
    await validationSubprocess.save()

    const validationResults: Array<{
      row: ParsedRow
      isValid: boolean
      errors: ValidationError[]
      productData?: Partial<IProduct>
      existingProduct?: IProduct | null
      action?: RowAction
    }> = []

    const duplicateSKUs = detectDuplicateSKUs(rows)
    const duplicateEANs = detectDuplicateEANs(rows)
    const rowSkus = rows.map((row) => getRowValue(row, 'sku').trim()).filter((sku) => sku.length > 0)
    const existingProducts = await Product.find({
      tenantId: new Types.ObjectId(tenantId),
      sku: { $in: rowSkus },
    }).lean()
    const existingProductBySku = new Map(existingProducts.map((product) => [product.sku, product as unknown as IProduct]))

    for (const row of rows) {
      const skuValue = getRowValue(row, 'sku').trim()

      if (!skuValue) {
        continue
      }

      const errors: ValidationError[] = []
      const requestedProductTypeId = getRowValue(row, 'productTypeId')
      const existingProduct = existingProductBySku.get(skuValue) ?? null
      const productTypeId = requestedProductTypeId || existingProduct?.productTypeId || ''

      const skuDuplicate = duplicateSKUs.get(skuValue)
      if (skuDuplicate && skuDuplicate.length > 1) {
        errors.push({ 
          field: 'sku', 
          message: `SKU duplicado en las filas ${skuDuplicate.join(', ')}`, 
          code: 'DUPLICATE_SKU' 
        })
      }

      const eanValue = getRowValue(row, 'ean').trim()
      if (eanValue) {
        const eanDuplicate = duplicateEANs.get(eanValue)
        if (eanDuplicate && eanDuplicate.length > 1) {
          errors.push({ 
            field: 'ean', 
            message: `EAN duplicado en las filas ${eanDuplicate.join(', ')}`, 
            code: 'DUPLICATE_EAN' 
          })
        }
      }

      const productType = findProductType(productTypeId)

      if (!productType) {
        validationResults.push({
          row,
          isValid: false,
          errors: [...errors, { field: 'productTypeId', message: `Tipo de producto '${productTypeId}' no existe`, code: 'INVALID_TYPE' }],
          action: 'error',
        })
        continue
      }

      if (!productType.isActive) {
        errors.push({ field: 'productTypeId', message: `El tipo de producto '${productTypeId}' está obsoleto y no permite nuevas importaciones`, code: 'DEPRECATED_TYPE' })
      }

      const result = validateRow(row, productType, existingProduct)
      validationResults.push({ 
        row, 
        isValid: result.isValid && errors.length === 0, 
        errors: [...errors, ...result.errors],
        productData: result.productData,
        existingProduct,
        action: result.action,
      })
    }

    validationSubprocess.status = 'completed'
    validationSubprocess.completedAt = new Date()
    validationSubprocess.durationMs = Date.now() - validationStart.getTime()
    await validationSubprocess.save()

    const importStart = new Date()
    const importSubprocess = new BulkSubProcess({
      processId,
      step: 'import',
      status: 'in_progress',
      startedAt: importStart,
    })
    await importSubprocess.save()

    let successCount = 0
    let errorCount = 0
    let createdCount = 0
    let updatedCount = 0
    let reactivatedCount = 0
    let deactivatedCount = 0
    let deletedCount = 0

    // Track SKUs imported in this batch for relation resolution
    const importedSkusInBatch = new Set<string>()

    // First pass: add existing product SKUs to the resolution set
    for (const [, product] of existingProductBySku) {
      importedSkusInBatch.add(product.sku)
    }

    for (const result of validationResults) {
      if (!result.isValid) {
        const itemLog = new ItemProcessLog({
          processId,
          rowNumber: result.row.rowNumber,
          status: 'error',
          action: 'error',
          originalData: result.row.originalData,
          errors: result.errors,
          processedAt: new Date(),
          retryAttempt: 0,
        })
        await itemLog.save()
        errorCount++
      } else if (result.productData) {
        try {
          let product: IProduct | null = null
          if (result.existingProduct) {
            product = await Product.findOneAndUpdate(
              { _id: result.existingProduct._id, tenantId: new Types.ObjectId(tenantId) },
              { $set: result.productData },
              { new: true }
            ) as IProduct | null
          } else {
            const createPayload = {
              ...result.productData,
              tenantId: new Types.ObjectId(tenantId),
            } as Partial<IProduct>

            if (!createPayload.ean) {
              delete createPayload.ean
            }

            const createdProduct = new Product(createPayload as IProduct)
            product = await createdProduct.save()
          }

          if (!product) {
            throw buildError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado para actualizar')
          }

          if (result.action === 'created') createdCount++
          if (result.action === 'updated') updatedCount++
          if (result.action === 'reactivated') reactivatedCount++
          if (result.action === 'deactivated') deactivatedCount++
          if (result.action === 'deleted') deletedCount++

          // Process relatedProducts if present
          const warnings: Array<{ entry: string; reason: string }> = []
          const relatedProductsCell = getRowValue(result.row, 'relatedProducts').trim()

          if (relatedProductsCell) {
            // Parse relatedProducts from cell
            const parsed = parseRelatedProductsFromCell(relatedProductsCell)
            warnings.push(...parsed.warnings)

            if (parsed.entries.length > 0) {
              // Validate for self-reference
              const { validEntries, warnings: selfRefWarnings } = validateRelatedProductsForImport(
                parsed.entries,
                product.sku
              )
              warnings.push(...selfRefWarnings)

              if (validEntries.length > 0) {
                // Resolve against DB and batch-imported SKUs
                const { resolved, unresolvedWarnings } = await resolveRelatedProducts(
                  tenantId,
                  validEntries,
                  importedSkusInBatch
                )
                warnings.push(...unresolvedWarnings)

                if (resolved.length > 0) {
                  // Update product with resolved relatedProducts
                  await Product.updateOne(
                    { _id: product._id, tenantId: new Types.ObjectId(tenantId) },
                    { $set: { relatedProducts: resolved } }
                  )
                }
              }
            }
          }

          // Add this product's SKU to the batch resolution set for subsequent rows
          importedSkusInBatch.add(product.sku)

          const itemLog = new ItemProcessLog({
            processId,
            rowNumber: result.row.rowNumber,
            status: 'success',
            action: result.action,
            originalData: result.row.originalData,
            errors: [],
            warnings: warnings.length > 0 ? warnings : [],
            processedAt: new Date(),
            productId: product._id as Types.ObjectId,
            retryAttempt: 0,
          })
          await itemLog.save()
          successCount++
        } catch (error) {
          const itemLog = new ItemProcessLog({
            processId,
            rowNumber: result.row.rowNumber,
            status: 'error',
            action: 'error',
            originalData: result.row.originalData,
            errors: [{ field: '_db', message: (error as Error).message, code: 'DB_ERROR' }],
            processedAt: new Date(),
            retryAttempt: 0,
          })
          await itemLog.save()
          errorCount++
        }
      }
    }

    importSubprocess.status = 'completed'
    importSubprocess.completedAt = new Date()
    importSubprocess.durationMs = Date.now() - importStart.getTime()
    await importSubprocess.save()

    process.processedItems = rows.length
    process.successItems = successCount
    process.errorItems = errorCount
    process.created = createdCount
    process.updated = updatedCount
    process.reactivated = reactivatedCount
    process.deactivated = deactivatedCount
    process.deleted = deletedCount

    const outcome = determineProcessOutcome(successCount, errorCount)
    process.status = outcome.status
    process.errorSummary = outcome.errorSummary

    process.completedAt = new Date()
    await process.save()

    const finalizationSubprocess = new BulkSubProcess({
      processId,
      step: 'finalization',
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 0,
    })
    await finalizationSubprocess.save()
  } catch (error) {
    console.error('Bulk import error:', error)

    const process = await BulkProcess.findById(processId)
    if (process) {
      process.status = 'failed'
      process.errorSummary = (error as Error).message
      process.completedAt = new Date()
      await process.save()
    }
  }
}

export const getProcessHistory = async (
  tenantId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ items: IBulkProcess[]; total: number }> => {
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    BulkProcess.find({ tenantId: new Types.ObjectId(tenantId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BulkProcess.countDocuments({ tenantId: new Types.ObjectId(tenantId) }),
  ])

  return { items: items as IBulkProcess[], total }
}

export const getProcessById = async (tenantId: string, processId: string): Promise<IBulkProcess | null> => {
  const process = await BulkProcess.findOne({
    _id: processId,
    tenantId: new Types.ObjectId(tenantId),
  }).lean()

  return process as IBulkProcess | null
}

export const getProcessFile = async (
  tenantId: string,
  processId: string
): Promise<{ fileName: string; fileContent: string } | null> => {
  const process = await BulkProcess.findOne({
    _id: processId,
    tenantId: new Types.ObjectId(tenantId),
  })
    .select({ fileName: 1, fileContent: 1 })
    .lean()

  if (!process || !process.fileContent) {
    return null
  }

  return {
    fileName: process.fileName,
    fileContent: process.fileContent,
  }
}

export const getProcessErrors = async (tenantId: string, processId: string): Promise<IItemProcessLog[]> => {
  const errors = await ItemProcessLog.find({
    processId,
    status: 'error',
  })
    .sort({ rowNumber: 1 })
    .lean()

  return errors as IItemProcessLog[]
}

/**
 * Get all process items that have warnings (including successful items).
 * This includes items where relations were omitted but the row was still imported.
 */
export const getProcessItemDetails = async (tenantId: string, processId: string): Promise<IItemProcessLog[]> => {
  const items = await ItemProcessLog.find({
    processId,
    $or: [
      { status: 'error' },
      { warnings: { $exists: true, $not: { $size: 0 } } },
    ],
  })
    .sort({ rowNumber: 1 })
    .lean()

  return items as IItemProcessLog[]
}

export type CsvFormat = 'multi-type' | 'single-type'

export interface FormatDetection {
  format: CsvFormat
  productTypeIdColumn: string
}

export const detectCsvFormat = (headers: string[]): FormatDetection => {
  const normalizedHeaders = headers.map(h => h.toLowerCase())

  const hasAttrColumns = normalizedHeaders.some(h => /^attr_\d+$/.test(h))
  if (hasAttrColumns) {
    return { format: 'multi-type', productTypeIdColumn: 'producttypeid' }
  }

  const hasProductTypeId = normalizedHeaders.includes('producttypeid')
  if (hasProductTypeId) {
    return { format: 'single-type', productTypeIdColumn: 'producttypeid' }
  }

  return { format: 'single-type', productTypeIdColumn: '' }
}

const parseAttributeValue = (attr: IProductAttribute, value: string): unknown => {
  if (attr.type === 'number') {
    const numValue = parseFloat(value)
    return isNaN(numValue) ? value : numValue
  }

  if (attr.type === 'boolean') {
    const boolValue = value.toLowerCase().trim()
    const validBooleanValues = ['true', 'false', '1', '0']
    if (!validBooleanValues.includes(boolValue)) {
      return value
    }
    return boolValue === 'true' || boolValue === '1'
  }

  if (attr.type === 'date') {
    const dateStr = value.trim()
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!isoDateRegex.test(dateStr)) {
      return value
    }
    const dateValue = new Date(dateStr)
    return dateValue.toISOString()
  }

  if (attr.type === 'select') {
    return value
  }

  if (attr.type === 'multiselect') {
    return value.split(';').map(v => v.trim())
  }

  return value
}

const getCaseInsensitiveValue = (row: Record<string, string>, candidates: string[]): string => {
  const normalizedCandidates = candidates.map((candidate) => candidate.toLowerCase())

  for (const [header, value] of Object.entries(row)) {
    if (normalizedCandidates.includes(header.toLowerCase())) {
      return value
    }
  }

  return ''
}

export const mapRowToAttributes = (
  row: Record<string, string>,
  format: CsvFormat,
  productType: IProductType
): Record<string, unknown> => {
  if (format === 'single-type') {
    const result: Record<string, unknown> = {}
    for (const attr of productType.attributes) {
      if (!attr.isActive || attr.isDeprecated) continue

      const value = getCaseInsensitiveValue(row, [attr.key, attr.label])
      if (value !== undefined && value.trim() !== '') {
        result[attr.key] = parseAttributeValue(attr, value)
      }
    }
    return result
  }

  const result: Record<string, unknown> = {}
  const attrMap = new Map<number, string>()

  for (const attr of productType.attributes) {
    if (!attr.isActive || attr.isDeprecated) continue
    if (attr.csvColumn !== undefined) {
      attrMap.set(attr.csvColumn, attr.key)
    }
  }

  for (const [header, value] of Object.entries(row)) {
    const match = header.toLowerCase().match(/^attr_(\d+)$/)
    if (!match) continue

    const colNum = parseInt(match[1], 10)
    const attrKey = attrMap.get(colNum)
    if (!attrKey) continue

    const attr = productType.attributes.find(a => a.key === attrKey)
    if (!attr) continue

    if (value.trim() !== '') {
      result[attrKey] = parseAttributeValue(attr, value)
    }
  }

  return result
}
