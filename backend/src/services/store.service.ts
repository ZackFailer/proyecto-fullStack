import { isValidObjectId, Types } from 'mongoose';
import { IStore, Store, StoreSettings, StoreStatus } from '../models/store.model.js';

export interface ServiceError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export interface ListStoresFilters {
  search?: string;
  status?: StoreStatus;
  page?: number;
  limit?: number;
  sort?: 'name' | 'createdAt' | 'updatedAt';
}

export interface ListStoresResult {
  items: IStore[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateStoreInput {
  slug: string;
  name: string;
  legalName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: StoreStatus;
  settings?: StoreSettings;
}

export interface UpdateStoreInput {
  name?: string;
  legalName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: StoreStatus;
}

export interface UpdateStoreSettingsInput {
  notes?: string;
  metadata?: Record<string, unknown>;
}

const buildError = (status: number, code: string, message: string, details?: unknown): ServiceError => {
  const error = new Error(message) as ServiceError;
  error.status = status;
  error.code = code;
  if (details !== undefined) {
    error.details = details;
  }
  return error;
};

const sanitizeStore = (store: IStore): IStore => {
  const storeRecord = store as unknown as Record<string, unknown>;
  const sanitized: Record<string, unknown> = { ...storeRecord };
  const rawId = sanitized.id ?? sanitized._id;

  if (rawId !== undefined && rawId !== null) {
    sanitized.id = typeof rawId === 'string' ? rawId : String(rawId);
  }

  const tenantId = sanitized.tenantId;
  if (tenantId !== undefined && tenantId !== null) {
    sanitized.tenantId = typeof tenantId === 'string' ? tenantId : String(tenantId);
  }

  delete sanitized._id;
  return sanitized as unknown as IStore;
};

const parseTenantId = (tenantId: string) => {
  if (!isValidObjectId(tenantId)) {
    throw buildError(400, 'INVALID_ID', 'tenantId invalido');
  }
};

const parseStoreId = (storeId: string) => {
  if (!isValidObjectId(storeId)) {
    throw buildError(400, 'INVALID_ID', 'storeId invalido');
  }
};

const ensureUnsupportedFields = (payload: Record<string, unknown>) => {
  if (payload.timezone !== undefined) {
    throw buildError(400, 'UNSUPPORTED_FIELD', 'timezone no es soportado en Store');
  }
  if (payload.currency !== undefined) {
    throw buildError(400, 'UNSUPPORTED_FIELD', 'currency no es soportado en Store');
  }
  if (payload.branding !== undefined) {
    throw buildError(400, 'UNSUPPORTED_FIELD', 'branding no es soportado en Store');
  }
};

const normalizeStoreSettings = (settings?: StoreSettings): StoreSettings | undefined => {
  if (!settings) return undefined;

  const normalized: StoreSettings = {};
  if (settings.notes !== undefined) normalized.notes = settings.notes.trim();
  if (settings.metadata !== undefined) normalized.metadata = settings.metadata;

  if (normalized.notes === undefined && normalized.metadata === undefined) {
    return undefined;
  }

  return normalized;
};

export const listStores = async (tenantId: string, filters: ListStoresFilters): Promise<ListStoresResult> => {
  parseTenantId(tenantId);

  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
  const sortField = filters.sort ?? 'updatedAt';

  const query: Record<string, unknown> = {
    tenantId: new Types.ObjectId(tenantId),
    deletedAt: null,
  };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { name: searchRegex },
      { legalName: searchRegex },
      { slug: searchRegex },
      { email: searchRegex },
    ];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Store.find(query).sort({ [sortField]: 1 }).skip(skip).limit(limit).lean(),
    Store.countDocuments(query),
  ]);

  return {
    items: items.map((item) => sanitizeStore(item as IStore)),
    page,
    limit,
    total,
  };
};

export const createStore = async (tenantId: string, payload: CreateStoreInput): Promise<IStore> => {
  parseTenantId(tenantId);
  ensureUnsupportedFields(payload as unknown as Record<string, unknown>);

  if (!payload.slug?.trim()) {
    throw buildError(400, 'VALIDATION_ERROR', 'slug es requerido');
  }

  if (!payload.name?.trim()) {
    throw buildError(400, 'VALIDATION_ERROR', 'name es requerido');
  }

  const store = new Store({
    tenantId: new Types.ObjectId(tenantId),
    slug: payload.slug.trim().toLowerCase(),
    name: payload.name.trim(),
    legalName: payload.legalName?.trim(),
    email: payload.email?.trim().toLowerCase(),
    phone: payload.phone?.trim(),
    address: payload.address?.trim(),
    status: payload.status ?? 'active',
    settings: normalizeStoreSettings(payload.settings),
  });

  const saved = await store.save();
  return sanitizeStore(saved.toJSON() as IStore);
};

export const getStoreById = async (tenantId: string, storeId: string): Promise<IStore | null> => {
  parseTenantId(tenantId);
  parseStoreId(storeId);

  const store = await Store.findOne({
    _id: storeId,
    tenantId: new Types.ObjectId(tenantId),
    deletedAt: null,
  }).lean();

  return store ? sanitizeStore(store as IStore) : null;
};

export const updateStore = async (
  tenantId: string,
  storeId: string,
  updates: UpdateStoreInput
): Promise<IStore | null> => {
  parseTenantId(tenantId);
  parseStoreId(storeId);
  ensureUnsupportedFields(updates as unknown as Record<string, unknown>);

  const updatePayload: Record<string, unknown> = {};
  if (updates.name !== undefined) updatePayload.name = updates.name.trim();
  if (updates.legalName !== undefined) updatePayload.legalName = updates.legalName.trim();
  if (updates.email !== undefined) updatePayload.email = updates.email.trim().toLowerCase();
  if (updates.phone !== undefined) updatePayload.phone = updates.phone.trim();
  if (updates.address !== undefined) updatePayload.address = updates.address.trim();
  if (updates.status !== undefined) updatePayload.status = updates.status;

  if (Object.keys(updatePayload).length === 0) {
    throw buildError(400, 'EMPTY_UPDATE', 'No se enviaron campos para actualizar');
  }

  const updated = await Store.findOneAndUpdate(
    {
      _id: storeId,
      tenantId: new Types.ObjectId(tenantId),
      deletedAt: null,
    },
    updatePayload,
    { new: true }
  ).lean();

  return updated ? sanitizeStore(updated as IStore) : null;
};

export const updateStoreSettings = async (
  tenantId: string,
  storeId: string,
  updates: UpdateStoreSettingsInput
): Promise<StoreSettings | null> => {
  parseTenantId(tenantId);
  parseStoreId(storeId);

  if (updates.notes === undefined && updates.metadata === undefined) {
    throw buildError(400, 'EMPTY_UPDATE', 'No se enviaron campos para actualizar settings');
  }

  const store = await Store.findOne({
    _id: storeId,
    tenantId: new Types.ObjectId(tenantId),
    deletedAt: null,
  }).lean();

  if (!store) return null;

  const current = (store as IStore).settings ?? {};
  const merged: StoreSettings = {
    ...(current.notes !== undefined ? { notes: current.notes } : {}),
    ...(current.metadata !== undefined ? { metadata: current.metadata } : {}),
  };

  if (updates.notes !== undefined) merged.notes = updates.notes.trim();
  if (updates.metadata !== undefined) merged.metadata = updates.metadata;

  const normalized = normalizeStoreSettings(merged);

  const updated = await Store.findOneAndUpdate(
    {
      _id: storeId,
      tenantId: new Types.ObjectId(tenantId),
      deletedAt: null,
    },
    { settings: normalized },
    { new: true }
  )
    .select({ settings: 1 })
    .lean();

  if (!updated) return null;

  return (updated as IStore).settings ?? null;
};
