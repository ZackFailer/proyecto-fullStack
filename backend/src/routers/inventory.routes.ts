import { Router } from 'express'
import * as inventoryTransferController from '../controllers/inventory-transfer.controller.js'
import { autenticate, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.use(autenticate)

router.post('/transfer/preview', requireRole('admin'), inventoryTransferController.previewTransfer)
router.post('/transfer', requireRole('admin'), inventoryTransferController.transferInventory)
router.get('/transfers', requireRole('admin', 'operator'), inventoryTransferController.listTransfers)

export default router
