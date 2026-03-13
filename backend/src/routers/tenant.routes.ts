import { Router } from 'express';
import {
  createTenantHandler,
  getTenantHandler,
  listTenantsHandler,
  updateTenantHandler,
} from '../controllers/tenant.controller.js';
import { requireTenantContext, resolveTenantContext } from '../middleware/tenantContext.middleware.js';
import userRouter from './user.routes.js';

const router = Router();

router.get('/', listTenantsHandler);
router.post('/', createTenantHandler);
router.get('/:tenantId', getTenantHandler);
router.patch('/:tenantId', updateTenantHandler);

router.use('/:tenantId/users', resolveTenantContext, requireTenantContext, userRouter);

export default router;
