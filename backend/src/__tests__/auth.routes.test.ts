import express from 'express';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import router from '../routers/index.js';
import { errorHandler } from '../middleware/error.middleware.js';
import * as userService from '../services/user.service.js';

// Track mock function outside module mock for external access
const externalMockFindByIdAndUpdate = vi.fn(() => Promise.resolve({}));

vi.mock('../models/user.model.js', () => {
  const mockLean = vi.fn();
  const mockFindOne = vi.fn(() => ({ lean: mockLean }));
  return {
    User: {
      findOne: mockFindOne,
      findByIdAndUpdate: vi.fn(() => Promise.resolve({})),
    },
    __mockLean: mockLean,
    __mockFindOne: mockFindOne,
  };
});

vi.mock('../services/user.service.js', () => ({
  createUser: vi.fn(),
  listUsers: vi.fn(),
  getUserById: vi.fn(),
  updateUser: vi.fn(),
  softDeleteUser: vi.fn(),
}));

// Import the mocks after setting up vi.mock
import { User } from '../models/user.model.js';

// Get the mocked functions
const mockFindOne = (User.findOne as ReturnType<typeof vi.fn>);
const mockLean = vi.fn();

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  app.use(errorHandler);
  return app;
};

const createPasswordHash = async (password: string) => {
  return bcrypt.hash(password, 10);
};

describe('login endpoint - user status validation', () => {
  const app = createApp();
  const validPassword = 'SecurePass123!';
  let validPasswordHash: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    validPasswordHash = await createPasswordHash(validPassword);
    // Reset mock implementations
    (mockFindOne as ReturnType<typeof vi.fn>).mockReturnValue({ lean: mockLean });
  });

  describe('POST /api/auth/login', () => {
    it('returns 401 when user status is suspended', async () => {
      mockLean.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: 'suspended@test.com',
        passwordHash: validPasswordHash,
        role: 'admin' as const,
        clientId: null,
        status: 'suspended' as const,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'suspended@test.com', password: validPassword });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Usuario no activo');
    });

    it('returns 401 when user status is invited', async () => {
      mockLean.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012',
        email: 'invited@test.com',
        passwordHash: validPasswordHash,
        role: 'admin' as const,
        clientId: null,
        status: 'invited' as const,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invited@test.com', password: validPassword });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Usuario no activo');
    });

    it('returns 401 when user status is deleted', async () => {
      mockLean.mockResolvedValue({
        _id: '507f1f77bcf86cd799439013',
        email: 'deleted@test.com',
        passwordHash: validPasswordHash,
        role: 'admin' as const,
        clientId: null,
        status: 'deleted' as const,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'deleted@test.com', password: validPassword });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Usuario no activo');
    });

    it('returns 200 when user status is active', async () => {
      mockLean.mockResolvedValue({
        _id: '507f1f77bcf86cd799439014',
        email: 'active@test.com',
        passwordHash: validPasswordHash,
        role: 'admin' as const,
        clientId: null,
        status: 'active' as const,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'active@test.com', password: validPassword });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login exitoso');
      expect(response.body.data).toBeDefined();
    });
  });
});

describe('login endpoint - lastLoginAt update', () => {
  const app = createApp();
  const validPassword = 'SecurePass123!';
  let validPasswordHash: string;

  // Get mock references at module scope
  let mockFindByIdAndUpdate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    validPasswordHash = await createPasswordHash(validPassword);
    (mockFindOne as ReturnType<typeof vi.fn>).mockReturnValue({ lean: mockLean });

    // Get the mocked findByIdAndUpdate from the module-level User mock
    const { User: MockedUser } = await import('../models/user.model.js');
    mockFindByIdAndUpdate = MockedUser.findByIdAndUpdate as ReturnType<typeof vi.fn>;
  });

  describe('POST /api/auth/login', () => {
    it('updates lastLoginAt on successful login', async () => {
      const userId = '507f1f77bcf86cd799439014';
      mockLean.mockResolvedValue({
        _id: userId,
        email: 'active@test.com',
        passwordHash: validPasswordHash,
        role: 'admin' as const,
        clientId: null,
        status: 'active' as const,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'active@test.com', password: validPassword });

      expect(response.status).toBe(200);
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ lastLoginAt: expect.any(Date) })
      );
    });
  });
});