import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import router from '../routers/index.js';
import { errorHandler } from '../middleware/error.middleware.js';
import * as userService from '../services/user.service.js';

vi.mock('../services/user.service.js', () => ({
  createUser: vi.fn(),
  listUsers: vi.fn(),
  getUserById: vi.fn(),
  updateUser: vi.fn(),
  softDeleteUser: vi.fn(),
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

const tenantId = '507f1f77bcf86cd799439011';
const nonExistentTenantId = '507f1f77bcf86cd799439012';

describe('user endpoints - scope and permissions', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===================== GLOBAL SCOPE TESTS =====================

  describe('global scope (/api/users)', () => {
    describe('listUsersHandler', () => {
      it('allows super-admin to list global users (super-admin role, no clientId)', async () => {
        vi.mocked(userService.listUsers).mockResolvedValue({
          items: [
            { id: 'u1', email: 'super@test.com', role: 'super-admin', clientId: null, status: 'active' } as any,
          ],
          page: 1,
          limit: 20,
          total: 1,
        });

        const token = signToken({ id: 'u-super', role: 'super-admin' });
        const response = await request(app).get('/api/users').set(authHeader(token));

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(userService.listUsers).toHaveBeenCalledWith(
          expect.objectContaining({ clientId: null, role: 'super-admin' })
        );
      });

      it('blocks non-super-admin from accessing global users', async () => {
        const token = signToken({ id: 'u-admin', role: 'admin', tenantId, clientId: tenantId });
        const response = await request(app).get('/api/users').set(authHeader(token));

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
        expect(userService.listUsers).not.toHaveBeenCalled();
      });

      it('blocks operator from accessing global users', async () => {
        const token = signToken({ id: 'u-op', role: 'operator', tenantId, clientId: tenantId });
        const response = await request(app).get('/api/users').set(authHeader(token));

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
      });

      it('blocks viewer from accessing global users', async () => {
        const token = signToken({ id: 'u-viewer', role: 'viewer', tenantId, clientId: tenantId });
        const response = await request(app).get('/api/users').set(authHeader(token));

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
      });
    });

    describe('getUserHandler', () => {
      it('allows super-admin to get a global user', async () => {
        vi.mocked(userService.getUserById).mockResolvedValue({
          id: 'u1',
          email: 'super@test.com',
          role: 'super-admin',
          clientId: null,
          status: 'active',
        } as any);

        const token = signToken({ id: 'u-super', role: 'super-admin' });
        const response = await request(app).get('/api/users/507f1f77bcf86cd799439011').set(authHeader(token));

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('blocks non-super-admin from getting global users', async () => {
        const token = signToken({ id: 'u-admin', role: 'admin', tenantId, clientId: tenantId });
        const response = await request(app).get('/api/users/507f1f77bcf86cd799439011').set(authHeader(token));

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
      });
    });

    describe('createUserHandler', () => {
      it('allows super-admin to create global users with super-admin role', async () => {
        vi.mocked(userService.createUser).mockResolvedValue({
          id: 'u-new',
          email: 'newsuper@test.com',
          role: 'super-admin',
          clientId: null,
          status: 'active',
        } as any);

        const token = signToken({ id: 'u-super', role: 'super-admin' });
        const response = await request(app)
          .post('/api/users')
          .set(authHeader(token))
          .send({
            email: 'newsuper@test.com',
            fullName: 'New Super Admin',
            role: 'super-admin',
            password: 'SecurePass123!',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(userService.createUser).toHaveBeenCalledWith(
          expect.objectContaining({ clientId: null, role: 'super-admin' })
        );
      });

      it('blocks super-admin from creating non-super-admin in global scope', async () => {
        const token = signToken({ id: 'u-super', role: 'super-admin' });
        const response = await request(app)
          .post('/api/users')
          .set(authHeader(token))
          .send({
            email: 'admin@test.com',
            fullName: 'Admin User',
            role: 'admin',
            password: 'SecurePass123!',
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('INVALID_ROLE');
        expect(userService.createUser).not.toHaveBeenCalled();
      });

      it('blocks non-super-admin from creating global users', async () => {
        const token = signToken({ id: 'u-admin', role: 'admin', tenantId, clientId: tenantId });
        const response = await request(app)
          .post('/api/users')
          .set(authHeader(token))
          .send({
            email: 'test@test.com',
            fullName: 'Test User',
            role: 'super-admin',
            password: 'SecurePass123!',
          });

        expect(response.status).toBe(403);
        expect(userService.createUser).not.toHaveBeenCalled();
      });
    });

    describe('updateUserHandler', () => {
      it('allows super-admin to update global users', async () => {
        vi.mocked(userService.updateUser).mockResolvedValue({
          id: 'u1',
          email: 'super@test.com',
          role: 'super-admin',
          fullName: 'Updated Name',
          clientId: null,
          status: 'active',
        } as any);

        const token = signToken({ id: 'u-super', role: 'super-admin' });
        const response = await request(app)
          .patch('/api/users/507f1f77bcf86cd799439011')
          .set(authHeader(token))
          .send({ fullName: 'Updated Name' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('blocks non-super-admin from updating global users', async () => {
        const token = signToken({ id: 'u-admin', role: 'admin', tenantId, clientId: tenantId });
        const response = await request(app)
          .patch('/api/users/507f1f77bcf86cd799439011')
          .set(authHeader(token))
          .send({ fullName: 'Hacked Name' });

        expect(response.status).toBe(403);
        expect(userService.updateUser).not.toHaveBeenCalled();
      });
    });

    describe('deleteUserHandler', () => {
      it('allows super-admin to delete global users', async () => {
        vi.mocked(userService.softDeleteUser).mockResolvedValue(true);

        const token = signToken({ id: 'u-super', role: 'super-admin' });
        const response = await request(app)
          .delete('/api/users/507f1f77bcf86cd799439011')
          .set(authHeader(token));

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(userService.softDeleteUser).toHaveBeenCalledWith(
          '507f1f77bcf86cd799439011',
          null
        );
      });

      it('blocks non-super-admin from deleting global users', async () => {
        const token = signToken({ id: 'u-admin', role: 'admin', tenantId, clientId: tenantId });
        const response = await request(app)
          .delete('/api/users/507f1f77bcf86cd799439011')
          .set(authHeader(token));

        expect(response.status).toBe(403);
        expect(userService.softDeleteUser).not.toHaveBeenCalled();
      });
    });
  });

  // ===================== TENANT SCOPE TESTS =====================

  describe('tenant scope (/api/tenants/:tenantId/users)', () => {
    describe('listUsersHandler', () => {
      it('allows admin to list users in their tenant', async () => {
        vi.mocked(userService.listUsers).mockResolvedValue({
          items: [
            { id: 'u1', email: 'admin@tenant.com', role: 'admin', clientId: tenantId, status: 'active' } as any,
          ],
          page: 1,
          limit: 20,
          total: 1,
        });

        const token = signToken({ id: 'u-admin', role: 'admin', tenantId, clientId: tenantId });
        const response = await request(app)
          .get(`/api/tenants/${tenantId}/users`)
          .set(authHeader(token));

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(userService.listUsers).toHaveBeenCalledWith(
          expect.objectContaining({ clientId: tenantId })
        );
      });

      it('allows operator to list users in their tenant (read-only)', async () => {
        vi.mocked(userService.listUsers).mockResolvedValue({
          items: [
            { id: 'u1', email: 'viewer@tenant.com', role: 'viewer', clientId: tenantId, status: 'active' } as any,
          ],
          page: 1,
          limit: 20,
          total: 1,
        });

        const token = signToken({ id: 'u-op', role: 'operator', tenantId, clientId: tenantId });
        const response = await request(app)
          .get(`/api/tenants/${tenantId}/users`)
          .set(authHeader(token));

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('allows viewer to list users in their tenant (read-only)', async () => {
        vi.mocked(userService.listUsers).mockResolvedValue({
          items: [
            { id: 'u1', email: 'viewer@tenant.com', role: 'viewer', clientId: tenantId, status: 'active' } as any,
          ],
          page: 1,
          limit: 20,
          total: 1,
        });

        const token = signToken({ id: 'u-viewer', role: 'viewer', tenantId, clientId: tenantId });
        const response = await request(app)
          .get(`/api/tenants/${tenantId}/users`)
          .set(authHeader(token));

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('blocks user from listing users in different tenant', async () => {
        const otherTenantId = '507f191e810c19729de860ea';
        const token = signToken({ id: 'u-op', role: 'operator', tenantId, clientId: tenantId });
        const response = await request(app)
          .get(`/api/tenants/${otherTenantId}/users`)
          .set(authHeader(token));

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
        expect(userService.listUsers).not.toHaveBeenCalled();
      });
    });

    describe('createUserHandler', () => {
      it('allows admin to create users in their tenant', async () => {
        vi.mocked(userService.createUser).mockResolvedValue({
          id: 'u-new',
          email: 'newuser@tenant.com',
          role: 'operator',
          clientId: tenantId,
          status: 'active',
        } as any);

        const token = signToken({ id: 'u-admin', role: 'admin', tenantId, clientId: tenantId });
        const response = await request(app)
          .post(`/api/tenants/${tenantId}/users`)
          .set(authHeader(token))
          .send({
            email: 'newuser@tenant.com',
            fullName: 'New User',
            role: 'operator',
            password: 'SecurePass123!',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(userService.createUser).toHaveBeenCalledWith(
          expect.objectContaining({ clientId: tenantId, role: 'operator' })
        );
      });

      it('blocks admin from creating super-admin in tenant scope', async () => {
        const token = signToken({ id: 'u-admin', role: 'admin', tenantId, clientId: tenantId });
        const response = await request(app)
          .post(`/api/tenants/${tenantId}/users`)
          .set(authHeader(token))
          .send({
            email: 'super@tenant.com',
            fullName: 'Super Admin',
            role: 'super-admin',
            password: 'SecurePass123!',
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('FORBIDDEN_ROLE');
        expect(userService.createUser).not.toHaveBeenCalled();
      });

      it('blocks operator from creating users in tenant', async () => {
        const token = signToken({ id: 'u-op', role: 'operator', tenantId, clientId: tenantId });
        const response = await request(app)
          .post(`/api/tenants/${tenantId}/users`)
          .set(authHeader(token))
          .send({
            email: 'newuser@tenant.com',
            fullName: 'New User',
            role: 'viewer',
            password: 'SecurePass123!',
          });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
        expect(userService.createUser).not.toHaveBeenCalled();
      });

      it('blocks viewer from creating users in tenant', async () => {
        const token = signToken({ id: 'u-viewer', role: 'viewer', tenantId, clientId: tenantId });
        const response = await request(app)
          .post(`/api/tenants/${tenantId}/users`)
          .set(authHeader(token))
          .send({
            email: 'newuser@tenant.com',
            fullName: 'New User',
            role: 'viewer',
            password: 'SecurePass123!',
          });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
        expect(userService.createUser).not.toHaveBeenCalled();
      });

      it('blocks admin from creating users in different tenant', async () => {
        const otherTenantId = '507f191e810c19729de860ea';
        const token = signToken({ id: 'u-admin', role: 'admin', tenantId, clientId: tenantId });
        const response = await request(app)
          .post(`/api/tenants/${otherTenantId}/users`)
          .set(authHeader(token))
          .send({
            email: 'newuser@other.com',
            fullName: 'New User',
            role: 'operator',
            password: 'SecurePass123!',
          });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
      });

      it('allows super-admin to create users in tenant scope (admin tenant view mode)', async () => {
        vi.mocked(userService.createUser).mockResolvedValue({
          id: 'u-new',
          email: 'newuser@tenant.com',
          role: 'admin',
          clientId: tenantId,
          status: 'active',
        } as any);

        const token = signToken({ id: 'u-super', role: 'super-admin', tenantId, clientId: tenantId });
        const response = await request(app)
          .post(`/api/tenants/${tenantId}/users`)
          .set(authHeader(token))
          .send({
            email: 'newuser@tenant.com',
            fullName: 'New User',
            role: 'admin',
            password: 'SecurePass123!',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(userService.createUser).toHaveBeenCalledWith(
          expect.objectContaining({ clientId: tenantId, role: 'admin' })
        );
      });
    });

    describe('updateUserHandler', () => {
      it('allows admin to update users in their tenant', async () => {
        vi.mocked(userService.updateUser).mockResolvedValue({
          id: 'u1',
          email: 'user@tenant.com',
          role: 'operator',
          fullName: 'Updated Name',
          clientId: tenantId,
          status: 'active',
        } as any);

        const token = signToken({ id: 'u-admin', role: 'admin', tenantId, clientId: tenantId });
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/507f1f77bcf86cd799439011`)
          .set(authHeader(token))
          .send({ fullName: 'Updated Name' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('blocks admin from promoting user to super-admin in tenant', async () => {
        const token = signToken({ id: 'u-admin', role: 'admin', tenantId, clientId: tenantId });
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/507f1f77bcf86cd799439011`)
          .set(authHeader(token))
          .send({ role: 'super-admin' });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('FORBIDDEN_ROLE');
        expect(userService.updateUser).not.toHaveBeenCalled();
      });

      it('blocks operator from updating users in tenant', async () => {
        const token = signToken({ id: 'u-op', role: 'operator', tenantId, clientId: tenantId });
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/507f1f77bcf86cd799439011`)
          .set(authHeader(token))
          .send({ fullName: 'Hacked Name' });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
        expect(userService.updateUser).not.toHaveBeenCalled();
      });

      it('blocks viewer from updating users in tenant', async () => {
        const token = signToken({ id: 'u-viewer', role: 'viewer', tenantId, clientId: tenantId });
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/507f1f77bcf86cd799439011`)
          .set(authHeader(token))
          .send({ fullName: 'Hacked Name' });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
        expect(userService.updateUser).not.toHaveBeenCalled();
      });
    });

    describe('deleteUserHandler', () => {
      it('allows admin to delete users in their tenant', async () => {
        vi.mocked(userService.softDeleteUser).mockResolvedValue(true);

        const token = signToken({ id: 'u-admin', role: 'admin', tenantId, clientId: tenantId });
        const response = await request(app)
          .delete(`/api/tenants/${tenantId}/users/507f1f77bcf86cd799439011`)
          .set(authHeader(token));

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(userService.softDeleteUser).toHaveBeenCalledWith(
          '507f1f77bcf86cd799439011',
          tenantId
        );
      });

      it('blocks operator from deleting users in tenant', async () => {
        const token = signToken({ id: 'u-op', role: 'operator', tenantId, clientId: tenantId });
        const response = await request(app)
          .delete(`/api/tenants/${tenantId}/users/507f1f77bcf86cd799439011`)
          .set(authHeader(token));

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
        expect(userService.softDeleteUser).not.toHaveBeenCalled();
      });

      it('blocks viewer from deleting users in tenant', async () => {
        const token = signToken({ id: 'u-viewer', role: 'viewer', tenantId, clientId: tenantId });
        const response = await request(app)
          .delete(`/api/tenants/${tenantId}/users/507f1f77bcf86cd799439011`)
          .set(authHeader(token));

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
        expect(userService.softDeleteUser).not.toHaveBeenCalled();
      });
    });
  });

  // ===================== INVALID ID TESTS =====================

  describe('validation', () => {
    it('returns 400 for invalid tenantId format', async () => {
      const token = signToken({ id: 'u-admin', role: 'admin', tenantId, clientId: tenantId });
      const response = await request(app)
        .get('/api/tenants/invalid-id/users')
        .set(authHeader(token));

      expect(response.status).toBe(400);
      // Middleware catches invalid tenantId before controller - returns INVALID_TENANT_CONTEXT
      expect(response.body.code).toBe('INVALID_TENANT_CONTEXT');
    });

    it('returns 400 for invalid user ID format', async () => {
      const token = signToken({ id: 'u-super', role: 'super-admin' });
      const response = await request(app)
        .get('/api/users/invalid-user-id')
        .set(authHeader(token));

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_ID');
    });
  });
});
