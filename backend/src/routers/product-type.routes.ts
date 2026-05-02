import { Router } from 'express'
import * as productTypeController from '../controllers/product-type.controller.js'
import { autenticate, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.use(autenticate)

router.get('', productTypeController.listProductTypes)
router.get('/:id', productTypeController.getProductTypeById)

router.post('', requireRole('admin'), productTypeController.createProductType)

router.put('/:id', requireRole('admin'), productTypeController.updateProductType)

router.delete('/:id', requireRole('admin'), productTypeController.deactivateProductType)

export default router