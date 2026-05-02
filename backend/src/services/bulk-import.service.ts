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

export interface ParsedRow {
  rowNumber: number
  data: Record<string, string>
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

export const parseCSV = (content: string): ParsedRow[] => {
  const lines = content.trim().split(/\r?\n/)
  if (lines.length < 2) {
    throw buildError(400, 'INVALID_CSV', 'El CSV debe tener al menos una fila de datos')
  }

  const delimiter = detectDelimiter(lines[0])
  const headers = lines[0].split(delimiter).map((h) => h.trim())
  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(delimiter)
    const data: Record<string, string> = {}

    headers.forEach((header, index) => {
      data[header] = values[index]?.trim() ?? ''
    })

    rows.push({ rowNumber: i + 1, data })
  }

  return rows
}

export const detectDuplicateSKUs = (rows: ParsedRow[]): Map<string, number[]> => {
  const skuMap = new Map<string, number[]>()
  
  for (const row of rows) {
    const sku = row.data.sku?.trim()
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
    const ean = row.data.ean?.trim()
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
  productType: IProductType
): { isValid: boolean; errors: ValidationError[]; productData?: Partial<IProduct> } => {
  const errors: ValidationError[] = []

  const productTypeId = row.data.productTypeId
  if (!productTypeId) {
    errors.push({ field: 'productTypeId', message: 'productTypeId es requerido', code: 'MISSING_FIELD' })
  }

  const sku = row.data.sku
  if (!sku) {
    errors.push({ field: 'sku', message: 'sku es requerido', code: 'MISSING_FIELD' })
  }

  const name = row.data.name
  if (!name) {
    errors.push({ field: 'name', message: 'name es requerido', code: 'MISSING_FIELD' })
  }

  const priceStr = row.data.price
  const price = priceStr ? parseFloat(priceStr) : NaN
  if (isNaN(price)) {
    errors.push({ field: 'price', message: 'price debe ser un número', code: 'INVALID_TYPE' })
  }

  const stockStr = row.data.stock
  const stock = stockStr ? parseFloat(stockStr) : 0
  if (isNaN(stock)) {
    errors.push({ field: 'stock', message: 'stock debe ser un número', code: 'INVALID_TYPE' })
  }

  const category = row.data.category
  if (!category) {
    errors.push({ field: 'category', message: 'category es requerido', code: 'MISSING_FIELD' })
  }

  const ean = row.data.ean || undefined

  const customAttributes: Record<string, unknown> = {}
  for (const attr of productType.attributes) {
    if (!attr.isActive || attr.isDeprecated) continue

    const value = row.data[attr.key]
    const hasValue = value && value.trim().length > 0

    if (attr.required && !hasValue) {
      errors.push({ field: attr.key, message: `${attr.label} es requerido`, code: 'MISSING_REQUIRED_FIELD' })
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
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: [],
    productData: {
      productTypeId: productType.id,
      productTypeVersion: productType.version,
      sku,
      ean,
      name,
      price,
      stock,
      category,
      customAttributes,
      status: 'active',
    },
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

    const validationResults: Array<{ row: ParsedRow; isValid: boolean; errors: ValidationError[]; productData?: Partial<IProduct> }> = []

    const duplicateSKUs = detectDuplicateSKUs(rows)
    const duplicateEANs = detectDuplicateEANs(rows)

    for (const row of rows) {
      const errors: ValidationError[] = []
      const productTypeId = row.data.productTypeId

      const skuDuplicate = duplicateSKUs.get(row.data.sku?.trim() || '')
      if (skuDuplicate && skuDuplicate.length > 1) {
        errors.push({ 
          field: 'sku', 
          message: `SKU duplicado en las filas ${skuDuplicate.join(', ')}`, 
          code: 'DUPLICATE_SKU' 
        })
      }

      const eanValue = row.data.ean?.trim()
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
        })
        continue
      }

      if (!productType.isActive) {
        errors.push({ field: 'productTypeId', message: `El tipo de producto '${productTypeId}' está obsoleto y no permite nuevas importaciones`, code: 'DEPRECATED_TYPE' })
      }

      const result = validateRow(row, productType)
      validationResults.push({ 
        row, 
        isValid: result.isValid && errors.length === 0, 
        errors: [...errors, ...result.errors],
        productData: result.productData 
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

    for (const result of validationResults) {
      if (!result.isValid) {
        const itemLog = new ItemProcessLog({
          processId,
          rowNumber: result.row.rowNumber,
          status: 'error',
          originalData: result.row.data,
          errors: result.errors,
          processedAt: new Date(),
          retryAttempt: 0,
        })
        await itemLog.save()
        errorCount++
      } else if (result.productData) {
        try {
          const product = new Product({
            ...result.productData,
            tenantId: new Types.ObjectId(tenantId),
          } as IProduct)

          await product.save()

          const itemLog = new ItemProcessLog({
            processId,
            rowNumber: result.row.rowNumber,
            status: 'success',
            originalData: result.row.data,
            errors: [],
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
            originalData: result.row.data,
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

    if (errorCount === 0) {
      process.status = 'completed'
    } else if (successCount === 0) {
      process.status = 'failed'
      process.errorSummary = 'Todos los productos fallaron la validación'
    } else {
      process.status = 'partial'
      process.errorSummary = `${errorCount} productos con errores`
    }

    process.completedAt = new Date()
    await process.save()

    try {
      await BulkProcess.updateOne(
        { _id: processId },
        { $unset: { fileContent: 1 } }
      )
    } catch (cleanupError) {
      console.warn('Failed to cleanup fileContent:', cleanupError)
    }

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

export const getProcessErrors = async (tenantId: string, processId: string): Promise<IItemProcessLog[]> => {
  const errors = await ItemProcessLog.find({
    processId,
    status: 'error',
  })
    .sort({ rowNumber: 1 })
    .lean()

  return errors as IItemProcessLog[]
}