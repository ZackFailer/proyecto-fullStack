import { NextFunction, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { AuthRequest, TenantContext } from '../models/auth.model.js';

const trimToUndefined = (value?: string | null): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const getTokenTenantId = (req: AuthRequest): string | undefined => {
  return trimToUndefined(req.user?.tenantId ?? req.user?.clientId ?? undefined);
};

export const resolveTenantContext = (req: AuthRequest, res: Response, next: NextFunction) => {
  const routeTenantId = trimToUndefined(typeof req.params.tenantId === 'string' ? req.params.tenantId : undefined);
  const headerTenantId = trimToUndefined(req.header('x-tenant-id'));
  const tokenTenantId = getTokenTenantId(req);

  if (routeTenantId && headerTenantId && routeTenantId !== headerTenantId) {
    res.status(400).json({
      success: false,
      message: 'Tenant en ruta y header no coinciden',
      code: 'INVALID_TENANT_CONTEXT',
    });
    return;
  }

  const tenantId = routeTenantId ?? headerTenantId ?? tokenTenantId;
  if (!tenantId) {
    next();
    return;
  }

  if (!isValidObjectId(tenantId)) {
    res.status(400).json({ success: false, message: 'tenantId invalido', code: 'INVALID_TENANT_CONTEXT' });
    return;
  }

  if (req.user?.role !== 'super-admin') {
    const authorizedTenantId = tokenTenantId;
    if (!authorizedTenantId || authorizedTenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No autorizado para este tenant', code: 'FORBIDDEN' });
      return;
    }
  }

  const source: TenantContext['source'] = routeTenantId ? 'route' : headerTenantId ? 'header' : 'token';
  req.tenantContext = { tenantId, source };

  next();
};

export const requireTenantContext = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.tenantContext?.tenantId) {
    res.status(400).json({
      success: false,
      message: 'Tenant context es requerido',
      code: 'INVALID_TENANT_CONTEXT',
    });
    return;
  }
  next();
};
