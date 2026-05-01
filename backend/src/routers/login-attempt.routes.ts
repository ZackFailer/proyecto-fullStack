import { Router } from 'express';
import { listLoginAttemptsHandler } from '../controllers/login-attempt.controller.js';

const router = Router();

router.get('/', listLoginAttemptsHandler);

export default router;
