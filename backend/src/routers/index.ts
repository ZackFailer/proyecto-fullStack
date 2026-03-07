import { Router } from 'express';
import productRoutes from './product.routes.js';
import homeRouter from "./home.routes.js";
import aboutRouter from "./about.routes.js";
import authRouter from "./auth.routes.js";

const router = Router();

router.use('/products', productRoutes);
router.use('/home', homeRouter);
router.use('/about', aboutRouter);
router.use('/auth', authRouter);

export default router;