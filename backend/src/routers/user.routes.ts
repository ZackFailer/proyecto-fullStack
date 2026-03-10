import { Router } from 'express';
import {
  createUserHandler,
  listUsersHandler,
  getUserHandler,
  updateUserHandler,
  deleteUserHandler,
} from '../controllers/user.controller.js';
import { autenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(autenticate);

router.get('/', listUsersHandler);
router.get('/:id', getUserHandler);
router.post('/', createUserHandler);
router.patch('/:id', updateUserHandler);
router.delete('/:id', deleteUserHandler);

export default router;
