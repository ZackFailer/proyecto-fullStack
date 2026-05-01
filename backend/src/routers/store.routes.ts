import { Router } from 'express';
import {
  createStoreHandler,
  getStoreHandler,
  listStoresHandler,
  updateStoreHandler,
} from '../controllers/store.controller.js';

const router = Router({ mergeParams: true });

router.get('/', listStoresHandler);
router.post('/', createStoreHandler);
router.get('/:storeId', getStoreHandler);
router.patch('/:storeId', updateStoreHandler);

export default router;
