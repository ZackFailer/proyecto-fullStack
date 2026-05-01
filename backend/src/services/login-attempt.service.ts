import { isValidObjectId, Types } from 'mongoose';
import { LoginAttempt, ILoginAttempt, LoginAttemptReason } from '../models/login-attempt.model.js';

export interface LogLoginAttemptInput {
  email: string;
  userId?: string | null;
  clientId?: string | null;
  success: boolean;
  reason: LoginAttemptReason;
  ip?: string;
  userAgent?: string;
}

export interface ListLoginAttemptsFilters {
  userId?: string;
  email?: string;
  success?: boolean;
  limit?: number;
}

const toObjectIdOrNull = (value?: string | null): Types.ObjectId | null => {
  if (value === null) return null;
  if (value === undefined || !isValidObjectId(value)) {
    return null;
  }
  return new Types.ObjectId(value);
};

/**
 * Logs a login attempt.
 * Wrapped in try/catch so logging failure doesn't break the auth flow.
 */
export const logLoginAttempt = async (input: LogLoginAttemptInput): Promise<void> => {
  try {
    const loginAttempt = new LoginAttempt({
      email: input.email.toLowerCase(),
      userId: toObjectIdOrNull(input.userId ?? null),
      clientId: toObjectIdOrNull(input.clientId ?? null),
      success: input.success,
      reason: input.reason,
      ip: input.ip,
      userAgent: input.userAgent,
    });

    await loginAttempt.save();
  } catch (error) {
    // Log the error but don't throw - logging failure shouldn't break auth
    console.error('Failed to log login attempt:', error);
  }
};

/**
 * Gets login attempts for a user
 */
export const getLoginAttemptsByUser = async (
  userId: string,
  options?: {
    limit?: number;
    success?: boolean;
  }
): Promise<ILoginAttempt[]> => {
  if (!isValidObjectId(userId)) {
    return [];
  }

  const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
  
  if (options?.success !== undefined) {
    query.success = options.success;
  }

  const limit = Math.min(100, Math.max(1, options?.limit ?? 20));

  const attempts = await LoginAttempt.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return attempts as ILoginAttempt[];
};

/**
 * Gets failed login attempts for an email (to detect brute force)
 */
export const getFailedLoginAttemptsByEmail = async (
  email: string,
  since: Date
): Promise<number> => {
  const count = await LoginAttempt.countDocuments({
    email: email.toLowerCase(),
    success: false,
    createdAt: { $gte: since },
  });

  return count;
};

/**
 * Lists login attempts using optional filters.
 * Intended for super-admin audit screens.
 */
export const listLoginAttempts = async (
  filters: ListLoginAttemptsFilters = {}
): Promise<ILoginAttempt[]> => {
  const query: Record<string, unknown> = {};

  if (filters.userId && isValidObjectId(filters.userId)) {
    query.userId = new Types.ObjectId(filters.userId);
  }

  if (filters.email) {
    query.email = filters.email.trim().toLowerCase();
  }

  if (filters.success !== undefined) {
    query.success = filters.success;
  }

  const limit = Math.min(200, Math.max(1, filters.limit ?? 50));

  const attempts = await LoginAttempt.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return attempts as ILoginAttempt[];
};
