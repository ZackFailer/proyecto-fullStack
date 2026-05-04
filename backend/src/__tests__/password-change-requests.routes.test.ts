import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import router from '../routers/index.js';
import { errorHandler } from '../middleware/error.middleware.js';

// Mock login attempt service to prevent real DB calls - use before imports
vi.mock('../services/login-attempt.service.js', () => ({
  logLoginAttempt: vi.fn(() => Promise.resolve()),
}));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api', router);
  app.use(errorHandler);
  return app;
};

describe('password change requests - basic endpoint tests', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/password-change-requests', () => {
    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/password-change-requests')
        .send({ targetUserId: '507f1f77bcf86cd799439012' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/password-change-requests', () => {
    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/password-change-requests');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/password-change-requests/:id/resolve', () => {
    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .patch('/api/password-change-requests/507f1f77bcf86cd799439012/resolve');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/password-change-requests/:id/reject', () => {
    it('returns 401 when not authenticated', async () => {
      const response = await request(app)
        .patch('/api/password-change-requests/507f1f77bcf86cd799439012/reject');

      expect(response.status).toBe(401);
    });
  });
});