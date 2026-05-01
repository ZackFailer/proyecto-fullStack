import { Router } from 'express';
import { login, logout, refresh, changePassword } from '../controllers/auth.controller.js';
import { autenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/logout', autenticate, logout);
router.post('/refresh', refresh);
router.post('/change-password', autenticate, changePassword);

export default router;