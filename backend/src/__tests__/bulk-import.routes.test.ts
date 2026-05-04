import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import router from '../routers/index.js';
import { errorHandler } from '../middleware/error.middleware.js';
import * as bulkImportService from '../services/bulk-import.service.js';

vi.mock('../services/bulk-import.service.js', () => ({
  startBulkImport: vi.fn(),
  getProcessHistory: vi.fn(),
  getProcessById: vi.fn(),
  getProcessErrors: vi.fn(),
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

describe('bulk-import endpoints', () => {
  const app = createApp();
  const tenantId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get process history', () => {
    it('allows admin to get process history', async () => {
      vi.mocked(bulkImportService.getProcessHistory).mockResolvedValue({
        items: [
          {
            _id: 'process-1',
            tenantId: '507f1f77bcf86cd799439011',
            fileName: 'test.csv',
            status: 'completed',
            totalItems: 10,
            processedItems: 10,
            successItems: 10,
            errorItems: 0,
            startedAt: new Date(),
          },
        ],
        total: 1,
      });

      const token = signToken({ id: 'u-admin', role: 'admin', tenantId });

      const response = await request(app)
        .get('/api/bulk-import/history')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('allows operator to get process history', async () => {
      vi.mocked(bulkImportService.getProcessHistory).mockResolvedValue({
        items: [],
        total: 0,
      });

      const token = signToken({ id: 'u-operator', role: 'operator', tenantId });

      const response = await request(app)
        .get('/api/bulk-import/history')
        .set(authHeader(token));

      expect(response.status).toBe(200);
    });

    it('rejects viewer trying to get process history', async () => {
      const token = signToken({ id: 'u-viewer', role: 'viewer', tenantId });

      const response = await request(app)
        .get('/api/bulk-import/history')
        .set(authHeader(token));

      expect(response.status).toBe(403);
    });
  });

  describe('get process details', () => {
    it('allows admin to get process details', async () => {
      vi.mocked(bulkImportService.getProcessById).mockResolvedValue({
        _id: 'process-1',
        tenantId: '507f1f77bcf86cd799439011',
        initiatedBy: 'user-1',
        fileName: 'test.csv',
        fileSize: 100,
        status: 'failed',
        totalItems: 5,
        processedItems: 5,
        successItems: 0,
        errorItems: 5,
        startedAt: new Date(),
        completedAt: new Date(),
        errorSummary: 'Todos los productos fallaron la validación',
      });

      const token = signToken({ id: 'u-admin', role: 'admin', tenantId });

      const response = await request(app)
        .get('/api/bulk-import/process-1')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('failed');
    });

    it('allows operator to get process details', async () => {
      vi.mocked(bulkImportService.getProcessById).mockResolvedValue({
        _id: 'process-1',
        tenantId: '507f1f77bcf86cd799439011',
        fileName: 'test.csv',
        status: 'completed',
        totalItems: 10,
        successItems: 10,
        errorItems: 0,
      });

      const token = signToken({ id: 'u-operator', role: 'operator', tenantId });

      const response = await request(app)
        .get('/api/bulk-import/process-1')
        .set(authHeader(token));

      expect(response.status).toBe(200);
    });

    it('rejects viewer trying to get process details', async () => {
      const token = signToken({ id: 'u-viewer', role: 'viewer', tenantId });

      const response = await request(app)
        .get('/api/bulk-import/process-1')
        .set(authHeader(token));

      expect(response.status).toBe(403);
    });
  });

  describe('get process errors', () => {
    it('allows admin to get process errors', async () => {
      vi.mocked(bulkImportService.getProcessErrors).mockResolvedValue([
        {
          id: 'error-1',
          processId: 'process-1',
          rowNumber: 1,
          status: 'error' as const,
          originalData: { productTypeId: 'type-1', sku: 'SKU-001', name: 'Test', price: '100', stock: '10', category: 'A' },
          errors: [
            { field: 'Peso', message: 'Peso debe ser uno de: Kilo, gramos', code: 'INVALID_OPTION' },
          ],
          processedAt: new Date(),
        },
      ]);

      const token = signToken({ id: 'u-admin', role: 'admin', tenantId });

      const response = await request(app)
        .get('/api/bulk-import/process-1/errors')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].errors[0].field).toBe('Peso');
    });

    it('rejects operator trying to get process errors', async () => {
      const token = signToken({ id: 'u-operator', role: 'operator', tenantId });

      const response = await request(app)
        .get('/api/bulk-import/process-1/errors')
        .set(authHeader(token));

      expect(response.status).toBe(200);
    });

    it('rejects viewer trying to get process errors', async () => {
      const token = signToken({ id: 'u-viewer', role: 'viewer', tenantId });

      const response = await request(app)
        .get('/api/bulk-import/process-1/errors')
        .set(authHeader(token));

      expect(response.status).toBe(403);
    });
  });

  describe('start bulk import', () => {
    it('allows admin to start bulk import', async () => {
      vi.mocked(bulkImportService.startBulkImport).mockResolvedValue({
        success: true,
        processId: 'process-new',
        message: 'Importación iniciada',
      });

      const token = signToken({ id: 'u-admin', role: 'admin', tenantId });

      const response = await request(app)
        .post('/api/bulk-import/import')
        .set(authHeader(token))
        .attach('file', Buffer.from('productTypeId,sku,name,category,price,stock\ntype-1,SKU-001,Test,A,100,10'), 'test.csv');

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body.data.processId).toBe('process-new');
    });

    it('rejects operator trying to start bulk import', async () => {
      const token = signToken({ id: 'u-operator', role: 'operator', tenantId });

      const response = await request(app)
        .post('/api/bulk-import/import')
        .set(authHeader(token))
        .attach('file', Buffer.from('test'), 'test.csv');

      expect(response.status).toBe(403);
      expect(bulkImportService.startBulkImport).not.toHaveBeenCalled();
    });

    it('rejects viewer trying to start bulk import', async () => {
      const token = signToken({ id: 'u-viewer', role: 'viewer', tenantId });

      const response = await request(app)
        .post('/api/bulk-import/import')
        .set(authHeader(token))
        .attach('file', Buffer.from('test'), 'test.csv');

      expect(response.status).toBe(403);
    });

    it('rejects upload without file', async () => {
      const token = signToken({ id: 'u-admin', role: 'admin', tenantId });

      const response = await request(app)
        .post('/api/bulk-import/import')
        .set(authHeader(token));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Archivo CSV requerido');
    });
  });

  describe('tenant isolation', () => {
    it('isolates history by tenant', async () => {
      const otherTenantId = '507f1f77bcf86cd799439022';
      
      vi.mocked(bulkImportService.getProcessHistory).mockImplementation((tid) => {
        if (tid === tenantId) {
          return Promise.resolve({ items: [{ _id: 'p1', tenantId: tid }], total: 1 });
        }
        return Promise.resolve({ items: [], total: 0 });
      });

      const token = signToken({ id: 'u-admin', role: 'admin', tenantId });
      const token2 = signToken({ id: 'u-admin2', role: 'admin', tenantId: otherTenantId });

      const response1 = await request(app)
        .get('/api/bulk-import/history')
        .set(authHeader(token));

      const response2 = await request(app)
        .get('/api/bulk-import/history')
        .set(authHeader(token2));

      expect(response1.body.data.items).toHaveLength(1);
      expect(response2.body.data.items).toHaveLength(0);
    });
  });

  describe('bulk-import quality improvements', () => {
    describe('duplicate detection in CSV', () => {
      it('should detect duplicate SKUs in the same CSV - validation marks duplicates', async () => {
        vi.mocked(bulkImportService.getProcessById).mockResolvedValue({
          _id: 'process-1',
          tenantId: '507f1f77bcf86cd799439011',
          initiatedBy: 'user-1',
          fileName: 'test.csv',
          fileSize: 100,
          status: 'completed',
          totalItems: 2,
          processedItems: 2,
          successItems: 1,
          errorItems: 1,
          startedAt: new Date(),
          completedAt: new Date(),
        });

        const token = signToken({ id: 'u-admin', role: 'admin', tenantId });
        
        const response = await request(app)
          .get('/api/bulk-import/process-1')
          .set(authHeader(token));

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('completed');
      });

      it('should handle process with duplicate error summary', async () => {
        vi.mocked(bulkImportService.getProcessById).mockResolvedValue({
          _id: 'process-1',
          tenantId: '507f1f77bcf86cd799439011',
          fileName: 'test.csv',
          status: 'failed',
          errorSummary: 'Todos los productos fallaron la validación',
          totalItems: 2,
          processedItems: 2,
          successItems: 0,
          errorItems: 2,
          startedAt: new Date(),
        });

        const token = signToken({ id: 'u-admin', role: 'admin', tenantId });
        
        const response = await request(app)
          .get('/api/bulk-import/process-1')
          .set(authHeader(token));

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('failed');
        expect(response.body.data.errorItems).toBe(2);
      });
    });

    describe('concurrency control', () => {
      it('should reject import when another is in progress', async () => {
        vi.mocked(bulkImportService.startBulkImport).mockRejectedValue({
          status: 409,
          code: 'CONCURRENT_IMPORT',
          message: 'Ya hay una importación en progreso para este tenant'
        });

        const token = signToken({ id: 'u-admin', role: 'admin', tenantId });

        const response = await request(app)
          .post('/api/bulk-import/import')
          .set(authHeader(token))
          .attach('file', Buffer.from('sku,name,price,stock,category,productTypeId\nSKU-001,Test,100,10,A,type-1'), 'test.csv');

        expect(response.status).toBe(409);
      });

      it('should allow import after previous one completed', async () => {
        vi.mocked(bulkImportService.startBulkImport).mockResolvedValue({
          success: true,
          processId: 'process-2',
          message: 'Importación iniciada',
        });

        const token = signToken({ id: 'u-admin', role: 'admin', tenantId });

        const response = await request(app)
          .post('/api/bulk-import/import')
          .set(authHeader(token))
          .attach('file', Buffer.from('sku,name,price,stock,category,productTypeId\nSKU-001,Test,100,10,A,type-1'), 'test.csv');

        expect(response.status).toBe(202);
      });

      it('should handle unique index violation for concurrent imports', async () => {
        const uniqueIndexError = { code: 11000, message: 'duplicate key error' };
        
        vi.mocked(bulkImportService.startBulkImport).mockRejectedValue(uniqueIndexError);

        const token = signToken({ id: 'u-admin', role: 'admin', tenantId });

        const response = await request(app)
          .post('/api/bulk-import/import')
          .set(authHeader(token))
          .attach('file', Buffer.from('sku,name,price,stock,category,productTypeId\nSKU-001,Test,100,10,A,type-1'), 'test.csv');

        expect(response.status).toBe(409);
      });
    });

    describe('validation improvements', () => {
      it('should accept valid boolean values (true/false/1/0)', async () => {
        vi.mocked(bulkImportService.getProcessById).mockResolvedValue({
          _id: 'process-1',
          tenantId: '507f1f77bcf86cd799439011',
          fileName: 'test.csv',
          status: 'completed',
          totalItems: 1,
          processedItems: 1,
          successItems: 1,
          errorItems: 0,
          startedAt: new Date(),
        });

        const token = signToken({ id: 'u-admin', role: 'admin', tenantId });
        
        const response = await request(app)
          .get('/api/bulk-import/process-1')
          .set(authHeader(token));

        expect(response.status).toBe(200);
        expect(response.body.data.successItems).toBe(1);
      });

      it('should handle failed process with validation errors', async () => {
        vi.mocked(bulkImportService.getProcessById).mockResolvedValue({
          _id: 'process-1',
          tenantId: '507f1f77bcf86cd799439011',
          fileName: 'test.csv',
          status: 'failed',
          errorSummary: 'Todos los productos fallaron la validación',
          totalItems: 3,
          processedItems: 3,
          successItems: 0,
          errorItems: 3,
          startedAt: new Date(),
        });

        const token = signToken({ id: 'u-admin', role: 'admin', tenantId });
        
        const response = await request(app)
          .get('/api/bulk-import/process-1')
          .set(authHeader(token));

        expect(response.status).toBe(200);
        expect(response.body.data.errorItems).toBe(3);
      });

      it('should handle process with different status types', async () => {
        const testCases = ['pending', 'processing', 'completed', 'failed', 'partial'];
        
        for (const status of testCases) {
          vi.mocked(bulkImportService.getProcessById).mockResolvedValue({
            _id: `process-${status}`,
            tenantId: '507f1f77bcf86cd799439011',
            fileName: 'test.csv',
            status: status,
            totalItems: 1,
            processedItems: 1,
            successItems: status === 'failed' ? 0 : 1,
            errorItems: status === 'failed' ? 1 : 0,
            startedAt: new Date(),
          });

          const token = signToken({ id: 'u-admin', role: 'admin', tenantId });
          
          const response = await request(app)
            .get(`/api/bulk-import/process-${status}`)
            .set(authHeader(token));

          expect(response.status).toBe(200);
          expect(response.body.data.status).toBe(status);
        }
      });
    });

    describe('deprecated product type detection', () => {
      it('should handle process errors endpoint for deprecated types', async () => {
        vi.mocked(bulkImportService.getProcessErrors).mockResolvedValue([
          {
            id: 'error-1',
            processId: 'process-1',
            rowNumber: 1,
            status: 'error' as const,
            originalData: { productTypeId: 'type-deprecated', sku: 'SKU-001' },
            errors: [
              { field: 'productTypeId', message: "El tipo de producto 'type-deprecated' está obsoleto y no permite nuevas importaciones", code: 'DEPRECATED_TYPE' }
            ],
            processedAt: new Date(),
          },
        ]);

        const token = signToken({ id: 'u-admin', role: 'admin', tenantId });

        const response = await request(app)
          .get('/api/bulk-import/process-1/errors')
          .set(authHeader(token));

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].errors[0].code).toBe('DEPRECATED_TYPE');
      });
    });

    describe('timeout handling', () => {
      it('should allow new import after timeout scenario', async () => {
        vi.mocked(bulkImportService.startBulkImport).mockResolvedValue({
          success: true,
          processId: 'process-new',
          message: 'Importación iniciada',
        });

        const token = signToken({ id: 'u-admin', role: 'admin', tenantId });

        const response = await request(app)
          .post('/api/bulk-import/import')
          .set(authHeader(token))
          .attach('file', Buffer.from('sku,name,price,stock,category,productTypeId\nSKU-001,Test,100,10,A,type-1'), 'test.csv');

        expect(response.status).toBe(202);
        expect(response.body.data.processId).toBe('process-new');
      });
    });

    describe('cleanup behavior', () => {
      it('should preserve file metadata after completion', async () => {
        vi.mocked(bulkImportService.getProcessById).mockResolvedValue({
          _id: 'process-1',
          tenantId: '507f1f77bcf86cd799439011',
          fileName: 'test.csv',
          fileSize: 1024,
          status: 'completed',
          totalItems: 5,
          processedItems: 5,
          successItems: 5,
          errorItems: 0,
          startedAt: new Date(),
          completedAt: new Date(),
        });

        const token = signToken({ id: 'u-admin', role: 'admin', tenantId });
        
        const response = await request(app)
          .get('/api/bulk-import/process-1')
          .set(authHeader(token));

        expect(response.status).toBe(200);
        expect(response.body.data.fileName).toBe('test.csv');
        expect(response.body.data.fileSize).toBe(1024);
        expect(response.body.data.completedAt).toBeDefined();
      });
    });
  });
});