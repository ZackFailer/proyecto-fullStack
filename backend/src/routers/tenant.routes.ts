import { Router } from 'express';
import {
  createTenantHandler,
  getTenantHandler,
  getTenantSettingsHandler,
  listTenantsHandler,
  updateTenantHandler,
  updateTenantSettingsHandler,
} from '../controllers/tenant.controller.js';
import { requireTenantContext, resolveTenantContext } from '../middleware/tenantContext.middleware.js';
import userRouter from './user.routes.js';
import storeRouter from './store.routes.js';

const router = Router();

router.get('/', listTenantsHandler);
router.post('/', createTenantHandler);
router.get('/:tenantId', getTenantHandler);
router.patch('/:tenantId', updateTenantHandler);
router.get('/:tenantId/settings', getTenantSettingsHandler);
router.patch('/:tenantId/settings', updateTenantSettingsHandler);

router.use('/:tenantId/users', resolveTenantContext, requireTenantContext, userRouter);
router.use('/:tenantId/stores', resolveTenantContext, requireTenantContext, storeRouter);

export default router;
