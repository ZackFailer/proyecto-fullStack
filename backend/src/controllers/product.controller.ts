import { Request, Response, NextFunction } from 'express'
import * as productService from '../services/product.service.js'

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const filters = {
      tenantId,
      productTypeId: req.query.productTypeId as string | undefined,
      category: req.query.category as string | undefined,
      status: req.query.status as 'active' | 'inactive' | undefined,
      search: req.query.search as string | undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    }

    const result = await productService.listProducts(filters)

    res.status(200).json({
      success: true,
      message: 'Lista de productos',
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const { id } = req.params
    const product = await productService.getProductById(tenantId, id)

    if (!product) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' })
      return
    }

    res.status(200).json({ success: true, message: 'Producto', data: product })
  } catch (error) {
    next(error)
  }
}

export const getProductBySku = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const { sku } = req.params
    const product = await productService.getProductBySku(tenantId, sku)

    if (!product) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' })
      return
    }

    res.status(200).json({ success: true, message: 'Producto', data: product })
  } catch (error) {
    next(error)
  }
}

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const result = await productService.createProduct({
      ...req.body,
      tenantId,
    })

    res.status(201).json({ success: true, message: 'Producto creado', data: result })
  } catch (error) {
    next(error)
  }
}

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const { id } = req.params
    const result = await productService.updateProduct(tenantId, id, req.body)

    if (!result) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' })
      return
    }

    res.status(200).json({ success: true, message: 'Producto actualizado', data: result })
  } catch (error) {
    next(error)
  }
}