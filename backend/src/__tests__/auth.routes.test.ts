import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
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
      findById: vi.fn(),
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

// Mock login attempt service to prevent real DB calls
vi.mock('../services/login-attempt.service.js', () => ({
  logLoginAttempt: vi.fn(() => Promise.resolve()),
}));

// Import the mocks after setting up vi.mock
import { User } from '../models/user.model.js';

// Get the mocked functions
const mockFindOne = (User.findOne as ReturnType<typeof vi.fn>);
const mockFindById = (User.findById as ReturnType<typeof vi.fn>);
const mockLean = vi.fn();

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
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

describe('login endpoint - sets dual cookies', () => {
  const app = createApp();
  const validPassword = 'SecurePass123!';
  let validPasswordHash: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    validPasswordHash = await createPasswordHash(validPassword);
    (mockFindOne as ReturnType<typeof vi.fn>).mockReturnValue({ lean: mockLean });
  });

  describe('POST /api/auth/login', () => {
    it('sets both token and refreshToken cookies on successful login', async () => {
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
      
      // Check that both cookies are set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.length).toBe(2);
      
      // Verify token cookie
      const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
      expect(tokenCookie).toContain('HttpOnly');
      expect(tokenCookie).toContain('SameSite=Strict');
      
      // Verify refreshToken cookie
      const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
      expect(refreshCookie).toContain('HttpOnly');
      expect(refreshCookie).toContain('SameSite=Strict');
    });

    it('returns user data in response', async () => {
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
      expect(response.body.data.user).toMatchObject({
        id: userId,
        role: 'admin',
        clientId: null,
        tenantId: null,
        email: 'active@test.com',
      });
    });
  });
});

describe('logout endpoint', () => {
  const app = createApp();
  const validPassword = 'SecurePass123!';
  let validPasswordHash: string;
  let mockFindByIdAndUpdate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    validPasswordHash = await createPasswordHash(validPassword);
    (mockFindOne as ReturnType<typeof vi.fn>).mockReturnValue({ lean: mockLean });
    
    // Get the mocked findByIdAndUpdate from the module-level User mock
    const { User: MockedUser } = await import('../models/user.model.js');
    mockFindByIdAndUpdate = MockedUser.findByIdAndUpdate as ReturnType<typeof vi.fn>;
  });

  const getAuthenticatedCookies = async () => {
    // First login to get cookies
    mockLean.mockResolvedValue({
      _id: '507f1f77bcf86cd799439014',
      email: 'logout@test.com',
      passwordHash: validPasswordHash,
      role: 'admin' as const,
      clientId: null,
      status: 'active' as const,
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'logout@test.com', password: validPassword });

    return loginResponse.headers['set-cookie'] as string[];
  };

  describe('POST /api/auth/logout', () => {
    it('clears both cookies on logout', async () => {
      const cookies = await getAuthenticatedCookies();
      
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Sesión cerrada');
      
      // Verify cookies are cleared (set-cookie includes max-age=0)
      const logoutCookies = response.headers['set-cookie'];
      expect(logoutCookies).toBeDefined();
    });

    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });
});

describe('refresh endpoint', () => {
  const app = createApp();
  const validPassword = 'SecurePass123!';
  let validPasswordHash: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    validPasswordHash = await createPasswordHash(validPassword);
    (mockFindOne as ReturnType<typeof vi.fn>).mockReturnValue({ lean: mockLean });
    (mockFindById as ReturnType<typeof vi.fn>).mockReturnValue({
      lean: () => Promise.resolve({
        _id: '507f1f77bcf86cd799439014',
        email: 'refresh@test.com',
        role: 'admin' as const,
        clientId: null,
        status: 'active' as const,
        deletedAt: null,
      })
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('returns 401 when no refresh token is provided', async () => {
      const response = await request(app)
        .post('/api/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token de refresh inválido o expirado');
    });

    it('returns 401 when refresh token is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=invalid_token']);

      expect(response.status).toBe(401);
    });

    it('returns 401 when token is not a refresh token type', async () => {
      // Use an access token as refresh token - should fail
      mockLean.mockResolvedValueOnce({
        _id: '507f1f77bcf86cd799439014',
        email: 'refresh@test.com',
        passwordHash: validPasswordHash,
        role: 'admin' as const,
        clientId: null,
        status: 'active' as const,
      });

      // First login to get tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'refresh@test.com', password: validPassword });

      const cookies = loginResponse.headers['set-cookie'] as string[];
      const accessToken = cookies.find((c: string) => c.startsWith('token='))?.split(';')[0].replace('token=', '');
      
      // Try to use access token as refresh token
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${accessToken}`]);

      expect(response.status).toBe(401);
    });

    it('returns new access token with valid refresh token', async () => {
      // First login to get a valid refresh token
      mockLean.mockResolvedValueOnce({
        _id: '507f1f77bcf86cd799439014',
        email: 'refresh@test.com',
        passwordHash: validPasswordHash,
        role: 'admin' as const,
        clientId: null,
        status: 'active' as const,
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'refresh@test.com', password: validPassword });

      const cookies = loginResponse.headers['set-cookie'] as string[];
      
      // Now use the refresh token
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBe('507f1f77bcf86cd799439014');
      expect(response.body.data.user.role).toBe('admin');
    });

    it('returns 401 when user no longer exists or is inactive', async () => {
      // First get a valid refresh token
      mockLean.mockResolvedValueOnce({
        _id: '507f1f77bcf86cd799439014',
        email: 'refresh@test.com',
        passwordHash: validPasswordHash,
        role: 'admin' as const,
        clientId: null,
        status: 'active' as const,
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'refresh@test.com', password: validPassword });

      const cookies = loginResponse.headers['set-cookie'] as string[];
      
      // Mock user as deleted/inactive
      (mockFindById as ReturnType<typeof vi.fn>).mockReturnValue({
        lean: () => Promise.resolve({
          _id: '507f1f77bcf86cd799439014',
          email: 'refresh@test.com',
          role: 'admin' as const,
          clientId: null,
          status: 'suspended' as const,
          deletedAt: null,
        })
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', cookies);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Token de refresh inválido o expirado');
    });
  });
});

describe('cookie attributes', () => {
  const app = createApp();
  const validPassword = 'SecurePass123!';
  let validPasswordHash: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    validPasswordHash = await createPasswordHash(validPassword);
    (mockFindOne as ReturnType<typeof vi.fn>).mockReturnValue({ lean: mockLean });
  });

  describe('POST /api/auth/login', () => {
    it('sets cookies with HttpOnly flag', async () => {
      mockLean.mockResolvedValue({
        _id: '507f1f77bcf86cd799439014',
        email: 'cookie@test.com',
        passwordHash: validPasswordHash,
        role: 'admin' as const,
        clientId: null,
        status: 'active' as const,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'cookie@test.com', password: validPassword });

      const cookies = response.headers['set-cookie'] as string[];

      // Both cookies should have HttpOnly
      cookies.forEach((cookie: string) => {
        expect(cookie).toContain('HttpOnly');
      });
    });

    it('sets cookies with SameSite=Strict', async () => {
      mockLean.mockResolvedValue({
        _id: '507f1f77bcf86cd799439014',
        email: 'cookie@test.com',
        passwordHash: validPasswordHash,
        role: 'admin' as const,
        clientId: null,
        status: 'active' as const,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'cookie@test.com', password: validPassword });

      const cookies = response.headers['set-cookie'] as string[];

      // Both cookies should have SameSite=Strict
      cookies.forEach((cookie: string) => {
        expect(cookie).toContain('SameSite=Strict');
      });
    });
  });
});

describe('change-password endpoint', () => {
  const app = createApp();
  const currentPassword = 'SecurePass123!';
  const newPassword = 'NewSecure456!@#';
  let currentPasswordHash: string;
  let mockFindById: ReturnType<typeof vi.fn>;
  let mockFindByIdAndUpdate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    currentPasswordHash = await createPasswordHash(currentPassword);
    (mockFindOne as ReturnType<typeof vi.fn>).mockReturnValue({ lean: mockLean });

    const { User: MockedUser } = await import('../models/user.model.js');
    mockFindById = MockedUser.findById as ReturnType<typeof vi.fn>;
    mockFindByIdAndUpdate = MockedUser.findByIdAndUpdate as ReturnType<typeof vi.fn>;
  });

  const getAuthenticatedCookies = async () => {
    mockLean.mockResolvedValue({
      _id: '507f1f77bcf86cd799439014',
      email: 'password@test.com',
      passwordHash: currentPasswordHash,
      role: 'admin' as const,
      clientId: null,
      status: 'active' as const,
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'password@test.com', password: currentPassword });

    return loginResponse.headers['set-cookie'] as string[];
  };

  describe('POST /api/auth/change-password', () => {
    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({ currentPassword, newPassword, confirmPassword: newPassword });

      expect(response.status).toBe(401);
    });

    it('returns 400 when currentPassword is missing', async () => {
      const cookies = await getAuthenticatedCookies();

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookies)
        .send({ newPassword, confirmPassword: newPassword });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('La contraseña actual es requerida');
    });

    it('returns 400 when newPassword is missing', async () => {
      const cookies = await getAuthenticatedCookies();

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookies)
        .send({ currentPassword, confirmPassword: newPassword });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('La nueva contraseña es requerida');
    });

    it('returns 400 when confirmPassword is missing', async () => {
      const cookies = await getAuthenticatedCookies();

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookies)
        .send({ currentPassword, newPassword });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('La confirmación de contraseña es requerida');
    });

    it('returns 400 when newPassword !== confirmPassword', async () => {
      const cookies = await getAuthenticatedCookies();

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookies)
        .send({ currentPassword, newPassword: 'Password123!', confirmPassword: 'Different123!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Las contraseñas no coinciden');
    });

    it('returns 400 when newPassword is weak (too short)', async () => {
      const cookies = await getAuthenticatedCookies();

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookies)
        .send({ currentPassword, newPassword: 'Short1!', confirmPassword: 'Short1!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('La contraseña debe tener al menos 12 caracteres');
    });

    it('returns 400 when newPassword is weak (no uppercase)', async () => {
      const cookies = await getAuthenticatedCookies();

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookies)
        .send({ currentPassword, newPassword: 'password123!a', confirmPassword: 'password123!a' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('La contraseña debe contenir al menos una letra mayúscula');
    });

    it('returns 400 when newPassword is weak (no lowercase)', async () => {
      const cookies = await getAuthenticatedCookies();

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookies)
        .send({ currentPassword, newPassword: 'PASSWORD123!A', confirmPassword: 'PASSWORD123!A' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('La contraseña debe contener al menos una letra minúscula');
    });

    it('returns 400 when newPassword is weak (no number)', async () => {
      const cookies = await getAuthenticatedCookies();

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookies)
        .send({ currentPassword, newPassword: 'PasswordAa!@#', confirmPassword: 'PasswordAa!@#' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('La contraseña debe contener al menos un número');
    });

    it('returns 400 when newPassword is weak (no symbol)', async () => {
      const cookies = await getAuthenticatedCookies();

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookies)
        .send({ currentPassword, newPassword: 'Password123Aa', confirmPassword: 'Password123Aa' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('La contraseña debe contener al menos un símbolo');
    });

    it('returns 401 when current password is invalid', async () => {
      const cookies = await getAuthenticatedCookies();

      // Mock findById to return user
      mockFindById.mockReturnValue({
        lean: () => Promise.resolve({
          _id: '507f1f77bcf86cd799439014',
          email: 'password@test.com',
          passwordHash: currentPasswordHash,
          role: 'admin' as const,
          clientId: null,
          status: 'active' as const,
          deletedAt: null,
        })
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookies)
        .send({ currentPassword: 'WrongPassword!', newPassword, confirmPassword: newPassword });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Contraseña actual incorrecta');
    });

    it('returns 400 when newPassword is same as current', async () => {
      const cookies = await getAuthenticatedCookies();

      mockFindById.mockReturnValue({
        lean: () => Promise.resolve({
          _id: '507f1f77bcf86cd799439014',
          email: 'password@test.com',
          passwordHash: currentPasswordHash,
          role: 'admin' as const,
          clientId: null,
          status: 'active' as const,
          deletedAt: null,
        })
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookies)
        .send({ currentPassword, newPassword: currentPassword, confirmPassword: currentPassword });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('La nueva contraseña debe ser diferente a la actual');
    });

    it('returns 401 when user status is not active', async () => {
      const cookies = await getAuthenticatedCookies();

      mockFindById.mockReturnValue({
        lean: () => Promise.resolve({
          _id: '507f1f77bcf86cd799439014',
          email: 'password@test.com',
          passwordHash: currentPasswordHash,
          role: 'admin' as const,
          clientId: null,
          status: 'suspended' as const,
          deletedAt: null,
        })
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookies)
        .send({ currentPassword, newPassword, confirmPassword: newPassword });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Usuario no activo');
    });

    it('successfully changes password with valid data', async () => {
      const cookies = await getAuthenticatedCookies();

      mockFindById.mockReturnValue({
        lean: () => Promise.resolve({
          _id: '507f1f77bcf86cd799439014',
          email: 'password@test.com',
          passwordHash: currentPasswordHash,
          role: 'admin' as const,
          clientId: null,
          status: 'active' as const,
          deletedAt: null,
        })
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookies)
        .send({ currentPassword, newPassword, confirmPassword: newPassword });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Contraseña actualizada');
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439014',
        expect.objectContaining({ passwordHash: expect.any(String) })
      );
    });

    it('returns 401 when user is not found', async () => {
      // Create cookies but mock user as not found
      mockLean.mockResolvedValue({
        _id: '507f1f77bcf86cd799439014',
        email: 'nonexistent@test.com',
        passwordHash: currentPasswordHash,
        role: 'admin' as const,
        clientId: null,
        status: 'active' as const,
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: currentPassword });

      const cookies = loginResponse.headers['set-cookie'] as string[];

      // Now mock findById to return null
      mockFindById.mockReturnValue({
        lean: () => Promise.resolve(null)
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookies)
        .send({ currentPassword, newPassword, confirmPassword: newPassword });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Usuario no encontrado');
    });
  });
});