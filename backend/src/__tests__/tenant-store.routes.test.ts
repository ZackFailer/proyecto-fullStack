import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import router from '../routers/index.js';
import { errorHandler } from '../middleware/error.middleware.js';
import * as tenantService from '../services/tenant.service.js';
import * as storeService from '../services/store.service.js';

vi.mock('../services/tenant.service.js', () => ({
  listTenants: vi.fn(),
  createTenant: vi.fn(),
  getTenantById: vi.fn(),
  updateTenant: vi.fn(),
  getTenantSettings: vi.fn(),
  updateTenantSettings: vi.fn(),
}));

vi.mock('../services/store.service.js', () => ({
  listStores: vi.fn(),
  createStore: vi.fn(),
  getStoreById: vi.fn(),
  updateStore: vi.fn(),
  updateStoreSettings: vi.fn(),
}));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  app.use(errorHandler);
  return app;
};

const signToken = (payload: Record<string, unknown>) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_no_usar_en_produccion');
};

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('tenant and store endpoints', () => {
  const app = createApp();
  const tenantId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows super-admin to get tenant settings', async () => {
    vi.mocked(tenantService.getTenantSettings).mockResolvedValue({
      currency: 'USD',
      branding: { logoUrl: 'https://cdn/logo.png' },
    });

    const token = signToken({ id: 'u-super', role: 'super-admin' });

    const response = await request(app)
      .get(`/api/tenants/${tenantId}/settings`)
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(tenantService.getTenantSettings).toHaveBeenCalledWith(tenantId);
  });

  it('rejects legacy timezone field on tenant create', async () => {
    const token = signToken({ id: 'u-super', role: 'super-admin' });

    const response = await request(app)
      .post('/api/tenants')
      .set(authHeader(token))
      .send({
        slug: 'acme',
        name: 'Acme',
        documentType: 'NIT',
        documentNumber: '123',
        timezone: 'UTC',
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('UNSUPPORTED_FIELD');
    expect(tenantService.createTenant).not.toHaveBeenCalled();
  });

  it('rejects settings payload on tenant identity update endpoint', async () => {
    const token = signToken({ id: 'u-super', role: 'super-admin' });

    const response = await request(app)
      .patch(`/api/tenants/${tenantId}`)
      .set(authHeader(token))
      .send({
        settings: { currency: 'USD' },
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('UNSUPPORTED_FIELD');
    expect(tenantService.updateTenant).not.toHaveBeenCalled();
  });

  it('blocks viewer from listing stores in own tenant', async () => {
    const token = signToken({
      id: 'u-viewer',
      role: 'viewer',
      tenantId,
      clientId: tenantId,
    });

    const response = await request(app)
      .get(`/api/tenants/${tenantId}/stores`)
      .set(authHeader(token));

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN');
    expect(storeService.listStores).not.toHaveBeenCalled();
  });

  it('blocks non-super-admin tenant mismatch before store handler', async () => {
    const tokenTenant = '507f191e810c19729de860ea';
    const routeTenant = '507f191e810c19729de860eb';

    const token = signToken({
      id: 'u-operator',
      role: 'operator',
      tenantId: tokenTenant,
      clientId: tokenTenant,
    });

    const response = await request(app)
      .get(`/api/tenants/${routeTenant}/stores`)
      .set(authHeader(token));

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN');
    expect(storeService.listStores).not.toHaveBeenCalled();
  });

  it('allows operator to list stores in authorized tenant', async () => {
    vi.mocked(storeService.listStores).mockResolvedValue({
      items: [
        {
          id: 'store-1',
          tenantId,
          slug: 'main-store',
          name: 'Main Store',
          status: 'active',
          deletedAt: null,
        } as any,
      ],
      page: 1,
      limit: 20,
      total: 1,
    });

    const token = signToken({
      id: 'u-operator',
      role: 'operator',
      tenantId,
      clientId: tenantId,
    });

    const response = await request(app)
      .get(`/api/tenants/${tenantId}/stores`)
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(storeService.listStores).toHaveBeenCalledWith(tenantId, {});
  });
});
