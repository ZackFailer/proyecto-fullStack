import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import router from '../routers/index.js';
import { errorHandler } from '../middleware/error.middleware.js';
import * as productTypeService from '../services/product-type.service.js';

vi.mock('../services/product-type.service.js', () => ({
  listProductTypes: vi.fn(),
  getProductTypeById: vi.fn(),
  createProductType: vi.fn(),
  updateProductType: vi.fn(),
  deactivateProductType: vi.fn(),
}));

vi.mock('../services/login-attempt.service.js', () => ({
  logLoginAttempt: vi.fn(() => Promise.resolve()),
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

describe('product-type endpoints', () => {
  const app = createApp();
  const tenantId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list product types', () => {
    it('allows admin to list product types', async () => {
      vi.mocked(productTypeService.listProductTypes).mockResolvedValue([
        {
          id: 'type-1',
          name: 'Comida',
          version: 1,
          isActive: true,
          status: 'draft' as const,
          attributes: [],
        },
      ]);

      const token = signToken({ id: 'u-admin', role: 'admin', tenantId });

      const response = await request(app)
        .get('/api/product-types')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('allows operator to list product types', async () => {
      vi.mocked(productTypeService.listProductTypes).mockResolvedValue([]);

      const token = signToken({ id: 'u-operator', role: 'operator', tenantId });

      const response = await request(app)
        .get('/api/product-types')
        .set(authHeader(token));

      expect(response.status).toBe(200);
    });

    it('allows viewer to list product types', async () => {
      vi.mocked(productTypeService.listProductTypes).mockResolvedValue([]);

      const token = signToken({ id: 'u-viewer', role: 'viewer', tenantId });

      const response = await request(app)
        .get('/api/product-types')
        .set(authHeader(token));

      expect(response.status).toBe(200);
    });

    it('rejects unauthenticated request', async () => {
      const response = await request(app).get('/api/product-types');

      expect(response.status).toBe(401);
    });
  });

  describe('create product type', () => {
    it('allows admin to create product type', async () => {
      vi.mocked(productTypeService.createProductType).mockResolvedValue({
        id: 'type-new',
        name: 'Nuevo Tipo',
        version: 1,
        isActive: true,
        status: 'draft' as const,
        attributes: [],
      });

      const token = signToken({ id: 'u-admin', role: 'admin', tenantId });

      const response = await request(app)
        .post('/api/product-types')
        .set(authHeader(token))
        .send({
          name: 'Nuevo Tipo',
          isActive: true,
          attributes: [],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('rejects operator trying to create product type', async () => {
      const token = signToken({ id: 'u-operator', role: 'operator', tenantId });

      const response = await request(app)
        .post('/api/product-types')
        .set(authHeader(token))
        .send({
          name: 'Nuevo Tipo',
          isActive: true,
        });

      expect(response.status).toBe(403);
      expect(productTypeService.createProductType).not.toHaveBeenCalled();
    });

    it('rejects viewer trying to create product type', async () => {
      const token = signToken({ id: 'u-viewer', role: 'viewer', tenantId });

      const response = await request(app)
        .post('/api/product-types')
        .set(authHeader(token))
        .send({
          name: 'Nuevo Tipo',
          isActive: true,
        });

      expect(response.status).toBe(403);
    });

    it('rejects super-admin from creating product type without tenant', async () => {
      const token = signToken({ id: 'u-super', role: 'super-admin', tenantId: undefined });

      const response = await request(app)
        .post('/api/product-types')
        .set(authHeader(token))
        .send({
          name: 'Nuevo Tipo',
          isActive: true,
        });

      expect(response.status).toBe(403);
    });
  });

  describe('update product type', () => {
    it('allows admin to update product type', async () => {
      vi.mocked(productTypeService.updateProductType).mockResolvedValue({
        id: 'type-1',
        name: 'Tipo Actualizado',
        version: 2,
        isActive: true,
        status: 'draft' as const,
        attributes: [],
      });

      const token = signToken({ id: 'u-admin', role: 'admin', tenantId });

      const response = await request(app)
        .put('/api/product-types/type-1')
        .set(authHeader(token))
        .send({
          name: 'Tipo Actualizado',
        });

      expect(response.status).toBe(200);
    });

    it('rejects operator trying to update product type', async () => {
      const token = signToken({ id: 'u-operator', role: 'operator', tenantId });

      const response = await request(app)
        .put('/api/product-types/type-1')
        .set(authHeader(token))
        .send({
          name: 'Tipo Actualizado',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('delete product type', () => {
    it('allows admin to deactivate product type', async () => {
      vi.mocked(productTypeService.deactivateProductType).mockResolvedValue(true);

      const token = signToken({ id: 'u-admin', role: 'admin', tenantId });

      const response = await request(app)
        .delete('/api/product-types/type-1')
        .set(authHeader(token));

      expect(response.status).toBe(200);
    });

    it('rejects operator trying to delete product type', async () => {
      const token = signToken({ id: 'u-operator', role: 'operator', tenantId });

      const response = await request(app)
        .delete('/api/product-types/type-1')
        .set(authHeader(token));

      expect(response.status).toBe(403);
    });
  });
});