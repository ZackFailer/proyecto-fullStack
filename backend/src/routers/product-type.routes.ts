import { Router } from 'express'
import * as productTypeController from '../controllers/product-type.controller.js'
import { autenticate, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.use(autenticate)

router.get('', productTypeController.listProductTypes)
router.get('/template', productTypeController.downloadMultiTypeTemplate)
router.get('/template/all', productTypeController.downloadMultiTypeTemplate)
router.get('/:id', productTypeController.getProductTypeById)
router.get('/:id/template', productTypeController.downloadTemplate)

router.post('', requireRole('admin'), productTypeController.createProductType)

router.put('/:id', requireRole('admin'), productTypeController.updateProductType)

router.delete('/:id', requireRole('admin'), productTypeController.deactivateProductType)

export default router
