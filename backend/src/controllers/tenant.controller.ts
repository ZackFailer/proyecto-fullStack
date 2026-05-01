import { NextFunction, Response } from 'express';
import { AuthRequest } from '../models/auth.model.js';
import {
  createTenant,
  getTenantById,
  getTenantSettings,
  listTenants,
  updateTenant,
  updateTenantSettings,
  CreateTenantInput,
  ListTenantsFilters,
  UpdateTenantInput,
  UpdateTenantSettingsInput,
} from '../services/tenant.service.js';

const requireSuperAdmin = (req: AuthRequest, res: Response): boolean => {
  if (req.user?.role !== 'super-admin') {
    res.status(403).json({ success: false, message: 'No autorizado', code: 'FORBIDDEN' });
    return false;
  }
  return true;
};

const rejectLegacyTenantFields = (req: AuthRequest, res: Response): boolean => {
  if (req.body.timezone !== undefined) {
    res.status(400).json({
      success: false,
      message: 'timezone no es soportado en este contrato',
      code: 'UNSUPPORTED_FIELD',
    });
    return true;
  }

  if (req.body.currency !== undefined) {
    res.status(400).json({
      success: false,
      message: 'currency root no es soportado. Use settings.currency',
      code: 'UNSUPPORTED_FIELD',
    });
    return true;
  }

  if (req.body.branding !== undefined) {
    res.status(400).json({
      success: false,
      message: 'branding root no es soportado. Use settings.branding',
      code: 'UNSUPPORTED_FIELD',
    });
    return true;
  }

  return false;
};

const parseSettingsInput = (input: unknown): UpdateTenantSettingsInput | undefined => {
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const source = input as Record<string, unknown>;
  const updates: UpdateTenantSettingsInput = {};

  if (source.currency !== undefined) {
    updates.currency = String(source.currency);
  }

  if (source.branding !== undefined && source.branding !== null && typeof source.branding === 'object') {
    const brandingSource = source.branding as Record<string, unknown>;
    updates.branding = {};

    if (brandingSource.logoUrl !== undefined) updates.branding.logoUrl = String(brandingSource.logoUrl);
    if (brandingSource.primaryColor !== undefined) updates.branding.primaryColor = String(brandingSource.primaryColor);
    if (brandingSource.secondaryColor !== undefined) updates.branding.secondaryColor = String(brandingSource.secondaryColor);
  }

  return updates;
};

export const listTenantsHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const filters: ListTenantsFilters = {};
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

    const result = await listTenants(filters);
    res.status(200).json({
      success: true,
      message: 'Tenants obtenidos',
      data: result.items,
      meta: { page: result.page, limit: result.limit, total: result.total },
    });
  } catch (error) {
    next(error);
  }
};

export const createTenantHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    if (rejectLegacyTenantFields(req, res)) return;

    const payload: CreateTenantInput = {
      slug: String(req.body.slug ?? ''),
      name: String(req.body.name ?? ''),
      documentType: String(req.body.documentType ?? ''),
      documentNumber: String(req.body.documentNumber ?? ''),
    };

    if (req.body.legalName !== undefined) payload.legalName = String(req.body.legalName);
    if (req.body.email !== undefined) payload.email = String(req.body.email);
    if (req.body.phone !== undefined) payload.phone = String(req.body.phone);
    if (req.body.address !== undefined) payload.address = String(req.body.address);
    if (req.body.status !== undefined) payload.status = req.body.status;

    const settings = parseSettingsInput(req.body.settings);
    if (settings !== undefined) payload.settings = settings;

    const tenant = await createTenant(payload);
    res.status(201).json({ success: true, message: 'Tenant creado', data: tenant });
  } catch (error) {
    next(error);
  }
};

export const getTenantHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const tenantId = typeof req.params.tenantId === 'string' ? req.params.tenantId : '';
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      res.status(404).json({ success: false, message: 'Tenant no encontrado', code: 'TENANT_NOT_FOUND' });
      return;
    }
    res.status(200).json({ success: true, message: 'Tenant obtenido', data: tenant });
  } catch (error) {
    next(error);
  }
};

export const updateTenantHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    if (rejectLegacyTenantFields(req, res)) return;

    const tenantId = typeof req.params.tenantId === 'string' ? req.params.tenantId : '';
    const updates: UpdateTenantInput = {};

    if (req.body.name !== undefined) updates.name = String(req.body.name);
    if (req.body.legalName !== undefined) updates.legalName = String(req.body.legalName);
    if (req.body.email !== undefined) updates.email = String(req.body.email);
    if (req.body.phone !== undefined) updates.phone = String(req.body.phone);
    if (req.body.address !== undefined) updates.address = String(req.body.address);
    if (req.body.status !== undefined) updates.status = req.body.status;

    const settings = parseSettingsInput(req.body.settings);
    if (settings !== undefined) updates.settings = settings;

    const tenant = await updateTenant(tenantId, updates);
    if (!tenant) {
      res.status(404).json({ success: false, message: 'Tenant no encontrado', code: 'TENANT_NOT_FOUND' });
      return;
    }

    res.status(200).json({ success: true, message: 'Tenant actualizado', data: tenant });
  } catch (error) {
    next(error);
  }
};

export const getTenantSettingsHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const tenantId = typeof req.params.tenantId === 'string' ? req.params.tenantId : '';
    const settings = await getTenantSettings(tenantId);

    if (!settings) {
      res.status(404).json({ success: false, message: 'Tenant no encontrado', code: 'TENANT_NOT_FOUND' });
      return;
    }

    res.status(200).json({ success: true, message: 'Settings del tenant obtenidos', data: settings });
  } catch (error) {
    next(error);
  }
};

export const updateTenantSettingsHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const tenantId = typeof req.params.tenantId === 'string' ? req.params.tenantId : '';
    const updates = parseSettingsInput(req.body) ?? {};

    const settings = await updateTenantSettings(tenantId, updates);
    if (!settings) {
      res.status(404).json({ success: false, message: 'Tenant no encontrado', code: 'TENANT_NOT_FOUND' });
      return;
    }

    res.status(200).json({ success: true, message: 'Settings del tenant actualizados', data: settings });
  } catch (error) {
    next(error);
  }
};
