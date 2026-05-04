import { Router } from 'express'
import multer from 'multer'
import * as bulkImportController from '../controllers/bulk-import.controller.js'
import { autenticate, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten archivos CSV'))
    }
  },
})

router.use(autenticate)

router.get('/history', requireRole('admin', 'operator'), bulkImportController.getProcessHistory)
router.get('/:id', requireRole('admin', 'operator'), bulkImportController.getProcessDetails)
router.get('/:id/errors', requireRole('admin', 'operator'), bulkImportController.getProcessErrors)
router.get('/:id/details', requireRole('admin', 'operator'), bulkImportController.getProcessItemDetails)
router.get('/:id/file', requireRole('admin', 'operator'), bulkImportController.downloadProcessFile)

router.post('/import', requireRole('admin'), upload.single('file'), bulkImportController.startBulkImport)

export default router
