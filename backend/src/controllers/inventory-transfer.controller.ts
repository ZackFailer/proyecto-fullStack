import { Request, Response, NextFunction } from 'express'
import * as inventoryTransferService from '../services/inventory-transfer.service.js'

export const transferInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined
    const userId = req.user?.id as string | undefined

    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    if (!userId) {
      res.status(400).json({ success: false, message: 'userId requerido' })
      return
    }

    const { fromSKU, toSKU, quantity, reason } = req.body

    const result = await inventoryTransferService.transferInventory(
      { fromSKU, toSKU, quantity, reason },
      tenantId,
      userId
    )

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Transferencia completada',
        data: result,
      })
    } else {
      res.status(500).json({
        success: false,
        message: result.error || 'Error en transferencia',
        data: result,
      })
    }
  } catch (error) {
    next(error)
  }
}

export const previewTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined

    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const { fromSKU, toSKU, quantity, reason } = req.body
    const result = await inventoryTransferService.previewTransfer({ fromSKU, toSKU, quantity, reason }, tenantId)

    res.status(200).json({
      success: true,
      message: 'Vista previa de transferencia',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export const listTransfers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId as string | undefined

    if (!tenantId) {
      res.status(400).json({ success: false, message: 'tenantId requerido' })
      return
    }

    const sku = req.query.sku as string | undefined
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await inventoryTransferService.getTransferHistory(tenantId, sku, page, limit)

    res.status(200).json({
      success: true,
      message: 'Historial de transferencias',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}
