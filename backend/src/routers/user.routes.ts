import { Router } from 'express';
import {
  createUserHandler,
  listUsersHandler,
  getUserHandler,
  updateUserHandler,
  deleteUserHandler,
  changePasswordHandler,
} from '../controllers/user.controller.js';

const router = Router({ mergeParams: true });

router.get('/', listUsersHandler);
router.get('/:id', getUserHandler);
router.post('/', createUserHandler);
router.patch('/:id', updateUserHandler);
router.patch('/:id/change-password', changePasswordHandler);
router.delete('/:id', deleteUserHandler);

export default router;
