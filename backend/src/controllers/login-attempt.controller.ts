import { NextFunction, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { AuthRequest } from '../models/auth.model.js';
import { listLoginAttempts } from '../services/login-attempt.service.js';

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return undefined;
};

export const listLoginAttemptsHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'super-admin') {
      res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Solo super-admin puede consultar intentos de login',
      });
      return;
    }

    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    if (userId && !isValidObjectId(userId)) {
      res.status(400).json({
        success: false,
        code: 'INVALID_USER_ID',
        message: 'userId inválido',
      });
      return;
    }

    const email = typeof req.query.email === 'string' ? req.query.email : undefined;
    const success = toBoolean(req.query.success);
    const limitValue = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const limit = Number.isFinite(limitValue) ? limitValue : undefined;

    const attempts = await listLoginAttempts({
      userId,
      email,
      success,
      limit,
    });

    const data = attempts.map((attempt) => ({
      id: attempt._id?.toString() ?? attempt.id ?? '',
      email: attempt.email,
      userId: attempt.userId ? attempt.userId.toString() : null,
      clientId: attempt.clientId ? attempt.clientId.toString() : null,
      success: attempt.success,
      reason: attempt.reason,
      ip: attempt.ip ?? null,
      userAgent: attempt.userAgent ?? null,
      createdAt: attempt.createdAt,
    }));

    res.status(200).json({
      success: true,
      message: 'Intentos de login obtenidos',
      data: {
        items: data,
        total: data.length,
      },
    });
  } catch (err) {
    next(err);
  }
};
