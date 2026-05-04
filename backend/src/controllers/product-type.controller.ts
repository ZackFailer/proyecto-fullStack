import { Request, Response, NextFunction } from 'express'
import * as productTypeService from '../services/product-type.service.js'

export const createProductType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const result = await productTypeService.createProductType(tenantId, req.body)
    res.status(201).json({ success: true, message: 'Tipo de producto creado', data: result })
  } catch (error) {
    next(error)
  }
}

export const listProductTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const result = await productTypeService.listProductTypes(tenantId)
    res.status(200).json({ success: true, message: 'Lista de tipos de productos', data: result })
  } catch (error) {
    next(error)
  }
}

export const getProductTypeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const { id } = req.params
    const result = await productTypeService.getProductTypeById(tenantId, id)

    if (!result) {
      res.status(404).json({ success: false, message: 'Tipo de producto no encontrado' })
      return
    }

    res.status(200).json({ success: true, message: 'Tipo de producto', data: result })
  } catch (error) {
    next(error)
  }
}

export const updateProductType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const { id } = req.params
    const result = await productTypeService.updateProductType(tenantId, id, req.body)

    if (!result) {
      res.status(404).json({ success: false, message: 'Tipo de producto no encontrado' })
      return
    }

    res.status(200).json({ success: true, message: 'Tipo de producto actualizado', data: result })
  } catch (error) {
    next(error)
  }
}

export const deactivateProductType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const { id } = req.params
    const result = await productTypeService.deactivateProductType(tenantId, id)

    if (!result) {
      res.status(404).json({ success: false, message: 'Tipo de producto no encontrado' })
      return
    }

    res.status(200).json({ success: true, message: 'Tipo de producto desactivado' })
  } catch (error) {
    next(error)
  }
}

export const downloadTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const { id } = req.params
    const format = (req.query.format as string) || 'xlsx'

    const productType = await productTypeService.getProductTypeById(tenantId, id)

    if (!productType) {
      res.status(404).json({ success: false, message: 'Tipo de producto no encontrado' })
      return
    }

    if (format === 'csv') {
      const csv = productTypeService.generateCsvTemplate(productType)
      res.setHeader('Content-Type', 'text/csv;charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${productType.id}-template.csv"`)
      res.status(200).send(csv)
      return
    }

    const buffer = await productTypeService.generateExcelTemplate(productType)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${productType.id}-template.xlsx"`)
    res.status(200).send(buffer)
  } catch (error) {
    next(error)
  }
}
