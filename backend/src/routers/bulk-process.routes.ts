import { Router } from 'express'
import * as bulkImportController from '../controllers/bulk-import.controller.js'
import { autenticate, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.use(autenticate)

router.get('/:id/file', requireRole('admin', 'operator'), bulkImportController.downloadProcessFile)

export default router
