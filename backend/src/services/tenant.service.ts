import { isValidObjectId } from 'mongoose';
import { ITenant, Tenant, TenantStatus } from '../models/tenant.model.js';

export interface ServiceError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export interface ListTenantsFilters {
  search?: string;
  status?: TenantStatus;
  page?: number;
  limit?: number;
  sort?: 'name' | 'createdAt' | 'updatedAt';
}

export interface ListTenantsResult {
  items: ITenant[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateTenantInput {
  slug: string;
  name: string;
  legalName?: string;
  documentType: string;
  documentNumber: string;
  email?: string;
  phone?: string;
  address?: string;
  timezone?: string;
  currency?: string;
  status?: TenantStatus;
  branding?: ITenant['branding'];
}

export interface UpdateTenantInput {
  name?: string;
  legalName?: string;
  email?: string;
  phone?: string;
  address?: string;
  timezone?: string;
  currency?: string;
  status?: TenantStatus;
  branding?: ITenant['branding'];
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

const sanitizeTenant = (tenant: ITenant): ITenant => {
  const tenantRecord = tenant as unknown as Record<string, unknown>;
  const sanitized: Record<string, unknown> = { ...tenantRecord };
  const rawId = sanitized.id ?? sanitized._id;

  if (rawId !== undefined && rawId !== null) {
    sanitized.id = typeof rawId === 'string' ? rawId : String(rawId);
  }

  delete sanitized._id;
  return sanitized as unknown as ITenant;
};

const parseTenantId = (tenantId: string) => {
  if (!isValidObjectId(tenantId)) {
    throw buildError(400, 'INVALID_ID', 'tenantId invalido');
  }
};

export const listTenants = async (filters: ListTenantsFilters): Promise<ListTenantsResult> => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
  const sortField = filters.sort ?? 'updatedAt';

  const query: Record<string, unknown> = { deletedAt: null };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { name: searchRegex },
      { legalName: searchRegex },
      { slug: searchRegex },
      { documentNumber: searchRegex },
    ];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Tenant.find(query).sort({ [sortField]: 1 }).skip(skip).limit(limit).lean(),
    Tenant.countDocuments(query),
  ]);

  return {
    items: items.map((item) => sanitizeTenant(item as ITenant)),
    page,
    limit,
    total,
  };
};

export const createTenant = async (payload: CreateTenantInput): Promise<ITenant> => {
  if (!payload.slug?.trim()) {
    throw buildError(400, 'VALIDATION_ERROR', 'slug es requerido');
  }
  if (!payload.name?.trim()) {
    throw buildError(400, 'VALIDATION_ERROR', 'name es requerido');
  }
  if (!payload.documentType?.trim() || !payload.documentNumber?.trim()) {
    throw buildError(400, 'VALIDATION_ERROR', 'documentType y documentNumber son requeridos');
  }

  const tenant = new Tenant({
    slug: payload.slug.trim().toLowerCase(),
    name: payload.name.trim(),
    legalName: payload.legalName?.trim(),
    documentType: payload.documentType.trim(),
    documentNumber: payload.documentNumber.trim(),
    email: payload.email?.trim().toLowerCase(),
    phone: payload.phone?.trim(),
    address: payload.address?.trim(),
    timezone: payload.timezone?.trim() || 'UTC',
    currency: payload.currency?.trim().toUpperCase() || 'USD',
    status: payload.status ?? 'active',
    branding: payload.branding,
  });

  const saved = await tenant.save();
  return sanitizeTenant(saved.toJSON() as ITenant);
};

export const getTenantById = async (tenantId: string): Promise<ITenant | null> => {
  parseTenantId(tenantId);
  const tenant = await Tenant.findOne({ _id: tenantId, deletedAt: null }).lean();
  return tenant ? sanitizeTenant(tenant as ITenant) : null;
};

export const updateTenant = async (tenantId: string, updates: UpdateTenantInput): Promise<ITenant | null> => {
  parseTenantId(tenantId);

  const updatePayload: Record<string, unknown> = {};
  if (updates.name !== undefined) updatePayload.name = updates.name.trim();
  if (updates.legalName !== undefined) updatePayload.legalName = updates.legalName.trim();
  if (updates.email !== undefined) updatePayload.email = updates.email.trim().toLowerCase();
  if (updates.phone !== undefined) updatePayload.phone = updates.phone.trim();
  if (updates.address !== undefined) updatePayload.address = updates.address.trim();
  if (updates.timezone !== undefined) updatePayload.timezone = updates.timezone.trim();
  if (updates.currency !== undefined) updatePayload.currency = updates.currency.trim().toUpperCase();
  if (updates.status !== undefined) updatePayload.status = updates.status;
  if (updates.branding !== undefined) updatePayload.branding = updates.branding;

  if (Object.keys(updatePayload).length === 0) {
    throw buildError(400, 'VALIDATION_ERROR', 'No se enviaron campos para actualizar');
  }

  const updated = await Tenant.findOneAndUpdate(
    { _id: tenantId, deletedAt: null },
    updatePayload,
    { new: true }
  ).lean();

  return updated ? sanitizeTenant(updated as ITenant) : null;
};
