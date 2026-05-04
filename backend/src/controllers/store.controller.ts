import { NextFunction, Response } from 'express';
import { AuthRequest } from '../models/auth.model.js';
import {
  createStore,
  getStoreById,
  listStores,
  updateStore,
  CreateStoreInput,
  ListStoresFilters,
  UpdateStoreInput,
} from '../services/store.service.js';

const ensureAuthenticated = (req: AuthRequest, res: Response): boolean => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'No autenticado', code: 'UNAUTHORIZED' });
    return false;
  }
  return true;
};

const canReadStore = (req: AuthRequest, res: Response): boolean => {
  const role = req.user?.role;
  if (role === 'super-admin' || role === 'admin' || role === 'operator') {
    return true;
  }

  res.status(403).json({ success: false, message: 'No autorizado', code: 'FORBIDDEN' });
  return false;
};

const canWriteStore = (req: AuthRequest, res: Response): boolean => {
  const role = req.user?.role;
  if (role === 'super-admin' || role === 'admin' || role === 'operator') {
    return true;
  }

  res.status(403).json({ success: false, message: 'No autorizado', code: 'FORBIDDEN' });
  return false;
};

const parseTenantId = (req: AuthRequest): string => {
  return typeof req.params.tenantId === 'string' ? req.params.tenantId : '';
};

const parseStoreId = (req: AuthRequest): string => {
  return typeof req.params.storeId === 'string' ? req.params.storeId : '';
};

export const listStoresHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!ensureAuthenticated(req, res)) return;
    if (!canReadStore(req, res)) return;

    const tenantId = parseTenantId(req);
    const filters: ListStoresFilters = {};

    if (typeof req.query.search === 'string') filters.search = req.query.search;
    if (typeof req.query.status === 'string') {
      const status = req.query.status;
      if (status === 'active' || status === 'suspended' || status === 'archived') {
        filters.status = status;
      }
    }
    if (typeof req.query.page === 'string') filters.page = Number(req.query.page);
    if (typeof req.query.limit === 'string') filters.limit = Number(req.query.limit);
    if (typeof req.query.sort === 'string') {
      const sort = req.query.sort;
      if (sort === 'name' || sort === 'createdAt' || sort === 'updatedAt') {
        filters.sort = sort;
      }
    }

    const result = await listStores(tenantId, filters);
    res.status(200).json({
      success: true,
      message: 'Stores obtenidas',
      data: result.items,
      meta: { page: result.page, limit: result.limit, total: result.total },
    });
  } catch (error) {
    next(error);
  }
};

export const createStoreHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!ensureAuthenticated(req, res)) return;
    if (!canWriteStore(req, res)) return;

    const tenantId = parseTenantId(req);
    const payload: CreateStoreInput = {
      slug: String(req.body.slug ?? ''),
      name: String(req.body.name ?? ''),
    };

    if (req.body.legalName !== undefined) payload.legalName = String(req.body.legalName);
    if (req.body.email !== undefined) payload.email = String(req.body.email);
    if (req.body.phone !== undefined) payload.phone = String(req.body.phone);
    if (req.body.address !== undefined) payload.address = String(req.body.address);
    if (req.body.status !== undefined) payload.status = req.body.status;
    if (req.body.settings !== undefined) payload.settings = req.body.settings;

    const store = await createStore(tenantId, payload);
    res.status(201).json({ success: true, message: 'Store creada', data: store });
  } catch (error) {
    next(error);
  }
};

export const getStoreHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!ensureAuthenticated(req, res)) return;
    if (!canReadStore(req, res)) return;

    const tenantId = parseTenantId(req);
    const storeId = parseStoreId(req);

    const store = await getStoreById(tenantId, storeId);
    if (!store) {
      res.status(404).json({ success: false, message: 'Store no encontrada', code: 'STORE_NOT_FOUND' });
      return;
    }

    res.status(200).json({ success: true, message: 'Store obtenida', data: store });
  } catch (error) {
    next(error);
  }
};

export const updateStoreHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!ensureAuthenticated(req, res)) return;
    if (!canWriteStore(req, res)) return;

    const tenantId = parseTenantId(req);
    const storeId = parseStoreId(req);

    const updates: UpdateStoreInput = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name);
    if (req.body.legalName !== undefined) updates.legalName = String(req.body.legalName);
    if (req.body.email !== undefined) updates.email = String(req.body.email);
    if (req.body.phone !== undefined) updates.phone = String(req.body.phone);
    if (req.body.address !== undefined) updates.address = String(req.body.address);
    if (req.body.status !== undefined) updates.status = req.body.status;

    const store = await updateStore(tenantId, storeId, updates);
    if (!store) {
      res.status(404).json({ success: false, message: 'Store no encontrada', code: 'STORE_NOT_FOUND' });
      return;
    }

    res.status(200).json({ success: true, message: 'Store actualizada', data: store });
  } catch (error) {
    next(error);
  }
};
