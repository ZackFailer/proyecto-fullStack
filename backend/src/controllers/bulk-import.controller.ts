import { Request, Response, NextFunction } from 'express'
import * as bulkImportService from '../services/bulk-import.service.js'

export const startBulkImport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    const userId = req.user?.id as string | undefined

    if (!tenantId || !userId) {
      res.status(400).json({ success: false, message: 'tenantId y userId requeridos' })
      return
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Archivo CSV requerido' })
      return
    }

    const content = req.file.buffer.toString('utf-8')
    const result = await bulkImportService.startBulkImport(
      tenantId,
      userId,
      req.file.originalname,
      req.file.size,
      content
    )

    res.status(202).json({ success: true, message: result.message, data: { processId: result.processId } })
  } catch (error) {
    next(error)
  }
}

export const getProcessHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await bulkImportService.getProcessHistory(tenantId, page, limit)

    const items = result.items.map(item => ({
      ...item,
      id: item._id.toString(),
    }))

    res.status(200).json({
      success: true,
      message: 'Historial de importaciones',
      data: {
        items,
        page,
        limit,
        total: result.total,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getProcessDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const { id } = req.params
    const result = await bulkImportService.getProcessById(tenantId, id)

    if (!result) {
      res.status(404).json({ success: false, message: 'Proceso no encontrado' })
      return
    }

    const responseData = {
      ...result,
      id: result._id.toString(),
    }

    res.status(200).json({ success: true, message: 'Detalles del proceso', data: responseData })
  } catch (error) {
    next(error)
  }
}

export const getProcessErrors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const { id } = req.params
    const result = await bulkImportService.getProcessErrors(tenantId, id)

    res.status(200).json({
      success: true,
      message: 'Errores del proceso',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export const getProcessItemDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const { id } = req.params
    const result = await bulkImportService.getProcessItemDetails(tenantId, id)

    res.status(200).json({
      success: true,
      message: 'Detalles del proceso (errores y advertencias)',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export const downloadProcessFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const { id } = req.params
    const processFile = await bulkImportService.getProcessFile(tenantId, id)

    if (!processFile) {
      res.status(404).json({ success: false, message: 'Archivo original no disponible para este proceso' })
      return
    }

    const normalizedFileName = processFile.fileName.endsWith('.csv')
      ? processFile.fileName
      : `${processFile.fileName}.csv`

    res.setHeader('Content-Type', 'text/csv;charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${normalizedFileName}"`)
    res.status(200).send(processFile.fileContent)
  } catch (error) {
    next(error)
  }
}
