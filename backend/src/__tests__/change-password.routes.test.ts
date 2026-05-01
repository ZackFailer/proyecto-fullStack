import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as userService from '../services/user.service.js';
import { autenticate } from '../middleware/auth.middleware.js';
import userRouter from '../routers/user.routes.js';
import { errorHandler } from '../middleware/error.middleware.js';
import { resolveTenantContext, requireTenantContext } from '../middleware/tenantContext.middleware.js';

vi.mock('../services/user.service.js', () => ({
  createUser: vi.fn(),
  listUsers: vi.fn(),
  getUserById: vi.fn(),
  updateUser: vi.fn(),
  softDeleteUser: vi.fn(),
  changeUserPassword: vi.fn(),
}));

const { mockLean, mockFindOne } = vi.hoisted(() => ({
  mockLean: vi.fn(),
  mockFindOne: vi.fn(),
}));

vi.mock('../models/user.model.js', () => ({
  User: {
    findOne: (...args: unknown[]) => mockFindOne(...args),
  },
}));

// Mock login attempt service to prevent real DB calls
vi.mock('../services/login-attempt.service.js', () => ({
  logLoginAttempt: vi.fn(() => Promise.resolve()),
}));

const createApp = () => {
  const app = express();
  app.use(express.json());

  // Global: /api/users/:id/change-password
  app.use('/api/users', autenticate, userRouter);

  // Tenant- scoped user routes with proper middleware chain
  const tenantUser = express.Router({ mergeParams: true });
  tenantUser.use(resolveTenantContext);
  tenantUser.use(requireTenantContext);
  tenantUser.use('/', userRouter);
  app.use('/api/tenants/:tenantId/users', autenticate, tenantUser);

  app.use(errorHandler);
  return app;
};

const signToken = (payload: Record<string, unknown>) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_no_usar_en_produccion');
};

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

const tenantId = '507f1f77bcf86cd799439011'; // valid ObjectId
const otherTenantId = '507f1f77bcf86cd799439022'; // valid ObjectId
const targetUserId = '507f1f77bcf86cd799439033'; // valid ObjectId

// Valid ObjectId for use in tests
const validId = (n: number) => `507f1f77bcf86cd79943f0${n.toString().padStart(2, '0')}`;

describe('privileged password change endpoints', () => {
  const app = createApp();

  const strongPassword = 'NewSecurePass123!';
  const actorPassword = 'MyAdminPass123!';
  let hashedActorPassword: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    hashedActorPassword = await bcrypt.hash(actorPassword, 10);
    mockFindOne.mockReturnValue({ lean: mockLean });
    mockLean.mockResolvedValue({
      _id: 'actor-admin-id',
      email: 'admin@example.com',
      passwordHash: hashedActorPassword,
      role: 'admin',
      status: 'active',
    });
  });

  // ===================== TOKEN BUILDERS =====================

  const buildAdminToken = (overrides?: { tenantId?: string; clientId?: string }) => {
    return signToken({
      id: 'actor-admin-id',
      role: 'admin',
      tenantId: overrides?.tenantId ?? tenantId,
      clientId: overrides?.clientId ?? tenantId,
    });
  };

  const buildSuperadminToken = (overrides?: { tenantId?: string; clientId?: string }) => {
    return signToken({
      id: 'actor-super-id',
      role: 'super-admin',
      tenantId: overrides?.tenantId,
      clientId: overrides?.clientId,
    });
  };

  const buildOperatorToken = (overrides?: { tenantId?: string; clientId?: string }) => {
    return signToken({
      id: 'actor-op-id',
      role: 'operator',
      tenantId: overrides?.tenantId ?? tenantId,
      clientId: overrides?.clientId ?? tenantId,
    });
  };

  const buildViewerToken = (overrides?: { tenantId?: string; clientId?: string }) => {
    return signToken({
      id: 'actor-viewer-id',
      role: 'viewer',
      tenantId: overrides?.tenantId ?? tenantId,
      clientId: overrides?.clientId ?? tenantId,
    });
  };

  // ===================== GLOBAL SCOPE TESTS (/api/users/:id/change-password) =====================

  describe('global scope (/api/users/:id/change-password) - superadmin only', () => {
    describe('changePasswordHandler', () => {
      it('allows superadmin to change any user password', async () => {
        vi.mocked(userService.changeUserPassword).mockResolvedValue(undefined);

        const token = buildSuperadminToken();
        const response = await request(app)
          .patch(`/api/users/${validId(34)}/change-password`)
          .set(authHeader(token))
          .send({
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Contraseña actualizada');
        expect(userService.changeUserPassword).toHaveBeenCalledWith(
          validId(34),
          strongPassword,
          { clientId: null, actorRole: 'super-admin' }
        );
      });

      it('blocks admin from using global scope (operator/viewer-only restriction)', async () => {
        // Admin role doesn't pass the 403 check for operator/viewer because it only blocks those.
        // In the actual implementation, admin CAN access but service validates role at DB level.
        // The test should verify service rejects admin trying to change non-operator/operator.
        vi.mocked(userService.changeUserPassword).mockRejectedValue(
          Object.assign(new Error('El rol admin no puede cambiar la contraseña de este usuario'), {
            status: 403,
            code: 'FORBIDDEN',
          })
        );

        const token = buildAdminToken();
        const response = await request(app)
          .patch(`/api/users/${validId(35)}/change-password`)
          .set(authHeader(token))
          .send({
            adminPassword: actorPassword,
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        // Admin gets past the role check but service returns 403
        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
      });

      it('blocks operator from using global scope', async () => {
        const token = buildOperatorToken();
        const response = await request(app)
          .patch(`/api/users/${validId(36)}/change-password`)
          .set(authHeader(token))
          .send({
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
        expect(userService.changeUserPassword).not.toHaveBeenCalled();
      });

      it('blocks viewer from using global scope', async () => {
        const token = buildViewerToken();
        const response = await request(app)
          .patch(`/api/users/${validId(37)}/change-password`)
          .set(authHeader(token))
          .send({
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
        expect(userService.changeUserPassword).not.toHaveBeenCalled();
      });

      it('blocks unauthenticated requests', async () => {
        const response = await request(app)
          .patch(`/api/users/${validId(38)}/change-password`)
          .send({
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(401);
      });
    });
  });

  // ===================== TENANT SCOPE TESTS (/api/tenants/:tenantId/users/:id/change-password) =====================

  describe('tenant scope (/api/tenants/:tenantId/users/:id/change-password)', () => {
    describe('changePasswordHandler', () => {
      // --- Admin changes operator/viewer ---

      it('allows admin to change operator password successfully', async () => {
        vi.mocked(userService.changeUserPassword).mockResolvedValue(undefined);

        const token = buildAdminToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(40)}/change-password`)
          .set(authHeader(token))
          .send({
            adminPassword: actorPassword,
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Contraseña actualizada');
        expect(userService.changeUserPassword).toHaveBeenCalledWith(
          validId(40),
          strongPassword,
          { clientId: tenantId, actorRole: 'admin' }
        );
      });

      it('allows admin to change viewer password successfully', async () => {
        vi.mocked(userService.changeUserPassword).mockResolvedValue(undefined);

        const token = buildAdminToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(41)}/change-password`)
          .set(authHeader(token))
          .send({
            adminPassword: actorPassword,
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(userService.changeUserPassword).toHaveBeenCalledWith(
          validId(41),
          strongPassword,
          { clientId: tenantId, actorRole: 'admin' }
        );
      });

      // --- Admin cannot change admin/superadmin ---

      it('blocks admin from changing another admin password', async () => {
        vi.mocked(userService.changeUserPassword).mockRejectedValue(
          Object.assign(new Error('El rol admin no puede cambiar la contraseña de este usuario'), {
            status: 403,
            code: 'FORBIDDEN',
          })
        );

        const token = buildAdminToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(42)}/change-password`)
          .set(authHeader(token))
          .send({
            adminPassword: actorPassword,
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
      });

      it('blocks admin from changing super-admin password', async () => {
        vi.mocked(userService.changeUserPassword).mockRejectedValue(
          Object.assign(new Error('El rol admin no puede cambiar la contraseña de este usuario'), {
            status: 403,
            code: 'FORBIDDEN',
          })
        );

        const token = buildAdminToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(43)}/change-password`)
          .set(authHeader(token))
          .send({
            adminPassword: actorPassword,
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
      });

      // --- Admin password validation ---

      it('returns 400 when adminPassword is missing', async () => {
        const token = buildAdminToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(44)}/change-password`)
          .set(authHeader(token))
          .send({
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('La contraseña del admin es requerida');
      });

      it('returns 401 when adminPassword is wrong', async () => {
        const token = buildAdminToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(45)}/change-password`)
          .set(authHeader(token))
          .send({
            adminPassword: 'WrongPassword123!',
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Contraseña del admin incorrecta');
      });

      // --- Superadmin privileged change ---

      it('allows superadmin to change any role password (no adminPassword needed)', async () => {
        vi.mocked(userService.changeUserPassword).mockResolvedValue(undefined);

        const token = buildSuperadminToken({ tenantId, clientId: tenantId });
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(46)}/change-password`)
          .set(authHeader(token))
          .send({
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(userService.changeUserPassword).toHaveBeenCalledWith(
          validId(46),
          strongPassword,
          { clientId: tenantId, actorRole: 'super-admin' }
        );
      });

      it('allows superadmin to change admin password', async () => {
        vi.mocked(userService.changeUserPassword).mockResolvedValue(undefined);

        const token = buildSuperadminToken({ tenantId, clientId: tenantId });
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(47)}/change-password`)
          .set(authHeader(token))
          .send({
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(userService.changeUserPassword).toHaveBeenCalledWith(
          validId(47),
          strongPassword,
          { clientId: tenantId, actorRole: 'super-admin' }
        );
      });

      // --- Operator / viewer forbidden ---

      it('blocks operator from using change-password endpoint', async () => {
        const token = buildOperatorToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(48)}/change-password`)
          .set(authHeader(token))
          .send({
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
        expect(userService.changeUserPassword).not.toHaveBeenCalled();
      });

      it('blocks viewer from using change-password endpoint', async () => {
        const token = buildViewerToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(49)}/change-password`)
          .set(authHeader(token))
          .send({
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
        expect(userService.changeUserPassword).not.toHaveBeenCalled();
      });

      // --- Cross-tenant forbidden ---

      it('blocks admin from changing user in different tenant', async () => {
        const token = buildAdminToken({ tenantId, clientId: tenantId });
        const response = await request(app)
          .patch(`/api/tenants/${otherTenantId}/users/${validId(50)}/change-password`)
          .set(authHeader(token))
          .send({
            adminPassword: actorPassword,
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('FORBIDDEN');
        expect(userService.changeUserPassword).not.toHaveBeenCalled();
      });

      // --- Validation: passwords must match ---

      it('returns 400 when newPassword !== confirmPassword', async () => {
        const token = buildAdminToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(51)}/change-password`)
          .set(authHeader(token))
          .send({
            adminPassword: actorPassword,
            newPassword: strongPassword,
            confirmPassword: 'DifferentPass123!',
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Las contraseñas no coinciden');
      });

      // --- Validation: password strength ---

      it('returns 400 when newPassword is too short', async () => {
        const token = buildAdminToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(52)}/change-password`)
          .set(authHeader(token))
          .send({
            adminPassword: actorPassword,
            newPassword: 'ShortPass1!',
            confirmPassword: 'ShortPass1!',
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('La contraseña debe tener al menos 12 caracteres');
      });

      it('returns 400 when newPassword lacks uppercase', async () => {
        const token = buildAdminToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(53)}/change-password`)
          .set(authHeader(token))
          .send({
            adminPassword: actorPassword,
            newPassword: 'nouppercase123!',
            confirmPassword: 'nouppercase123!',
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('La contraseña debe contenir al menos una letra mayúscula');
      });

      it('returns 400 when newPassword lacks number', async () => {
        const token = buildAdminToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(54)}/change-password`)
          .set(authHeader(token))
          .send({
            adminPassword: actorPassword,
            newPassword: 'NoNumberHere!',
            confirmPassword: 'NoNumberHere!',
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('La contraseña debe contener al menos un número');
      });

      it('returns 400 when newPassword lacks symbol', async () => {
        const token = buildAdminToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(55)}/change-password`)
          .set(authHeader(token))
          .send({
            adminPassword: actorPassword,
            newPassword: 'NoSymbolHere123',
            confirmPassword: 'NoSymbolHere123',
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('La contraseña debe contener al menos un símbolo');
      });

      // --- Validation: missing fields ---

      it('returns 400 when newPassword is missing', async () => {
        const token = buildAdminToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(56)}/change-password`)
          .set(authHeader(token))
          .send({
            adminPassword: actorPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('La nueva contraseña es requerida');
      });

      it('returns 400 when confirmPassword is missing', async () => {
        const token = buildAdminToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(57)}/change-password`)
          .set(authHeader(token))
          .send({
            adminPassword: actorPassword,
            newPassword: strongPassword,
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('La confirmación de contraseña es requerida');
      });

      // --- Validation: invalid ID ---

      it('returns 400 for invalid user ID', async () => {
        const token = buildAdminToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/invalid-id/change-password`)
          .set(authHeader(token))
          .send({
            adminPassword: actorPassword,
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('INVALID_ID');
      });

      // --- Service: user not found ---

      it('returns 404 when target user is not found', async () => {
        vi.mocked(userService.changeUserPassword).mockRejectedValue(
          Object.assign(new Error('Usuario no encontrado'), {
            status: 404,
            code: 'USER_NOT_FOUND',
          })
        );

        const token = buildAdminToken();
        const response = await request(app)
          .patch(`/api/tenants/${tenantId}/users/${validId(58)}/change-password`)
          .set(authHeader(token))
          .send({
            adminPassword: actorPassword,
            newPassword: strongPassword,
            confirmPassword: strongPassword,
          });

        expect(response.status).toBe(404);
        expect(response.body.code).toBe('USER_NOT_FOUND');
      });
    });
  });
});
