import { Router } from 'express';
import productRoutes from './product.routes.js';
import homeRouter from "./home.routes.js";
import aboutRouter from "./about.routes.js";
import authRouter from "./auth.routes.js";
import userRouter from './user.routes.js';
import { autenticate } from '../middleware/auth.middleware.js';
import tenantRouter from './tenant.routes.js';
import { resolveTenantContext } from '../middleware/tenantContext.middleware.js';

const router = Router();

router.use('/home', homeRouter);
router.use('/about', aboutRouter);
router.use('/auth', authRouter);


router.use(autenticate); // Middleware de autenticación para proteger las rutas siguientes
router.use(resolveTenantContext);
router.use('/tenants', tenantRouter);
router.use('/users', userRouter);
router.use('/products', productRoutes);

export default router;