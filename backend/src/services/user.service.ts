import { isValidObjectId, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, User, UserRole, UserStatus } from '../models/user.model.js';

export interface ServiceError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export interface CreateUserInput {
  clientId?: string | null;
  email: string;
  password?: string;
  fullName: string;
  role: UserRole;
  status?: UserStatus;
  phone?: string;
  locale?: string;
  invitedAt?: Date;
  createdBy?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  role?: UserRole;
  status?: UserStatus;
  phone?: string;
  locale?: string;
  password?: string;
  updatedBy?: string;
}

export interface ListUsersFilters {
  clientId?: string | null;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListUsersResult {
  items: IUser[];
  page: number;
  limit: number;
  total: number;
}

const buildError = (status: number, code: string, message: string, details?: unknown): ServiceError => {
  const err = new Error(message) as ServiceError;
  err.status = status;
  err.code = code;
  if (details) {
    err.details = details;
  }
  return err;
};

const hashPassword = async (password?: string): Promise<string | undefined> => {
  if (!password) return undefined;
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const toObjectIdOrNull = (value?: string | null): Types.ObjectId | null | undefined => {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (!isValidObjectId(value)) {
    throw buildError(400, 'INVALID_CLIENT', 'clientId inválido');
  }
  return new Types.ObjectId(value);
};

const sanitizeUser = (user: IUser): IUser => {
  const { passwordHash, ...rest } = user;
  return rest as IUser;
};

const ensureAnotherAdminExists = async (clientId: Types.ObjectId | null, excludeUserId: string) => {
  if (!clientId) return; // super-admin tenant-less not checked
  const hasAdmin = await User.exists({
    _id: { $ne: new Types.ObjectId(excludeUserId) },
    clientId,
    role: 'admin',
    status: 'active',
    deletedAt: null,
  });
  if (!hasAdmin) {
    throw buildError(400, 'LAST_ADMIN', 'No se puede eliminar o degradar al último admin activo');
  }
};

export const createUser = async (payload: CreateUserInput): Promise<IUser> => {
  if (!payload.email) {
    throw buildError(400, 'EMAIL_REQUIRED', 'Email es requerido');
  }
  if (!payload.fullName) {
    throw buildError(400, 'NAME_REQUIRED', 'Nombre es requerido');
  }
  if (!payload.role) {
    throw buildError(400, 'ROLE_REQUIRED', 'Rol es requerido');
  }

  const status: UserStatus = payload.status ?? 'active';
  if (status !== 'invited' && !payload.password) {
    throw buildError(400, 'PASSWORD_REQUIRED', 'La contraseña es requerida para usuarios activos');
  }

  const passwordHash = await hashPassword(payload.password);
  const clientId = payload.clientId !== undefined ? toObjectIdOrNull(payload.clientId) : null;

  const user = new User({
    clientId,
    email: payload.email,
    passwordHash,
    fullName: payload.fullName,
    role: payload.role,
    status,
    phone: payload.phone,
    locale: payload.locale,
    invitedAt: status === 'invited' ? new Date() : payload.invitedAt,
    createdBy: payload.createdBy ? new Types.ObjectId(payload.createdBy) : undefined,
  });

  const saved = await user.save();
  return sanitizeUser(saved.toJSON() as IUser);
};

export const listUsers = async (filters: ListUsersFilters): Promise<ListUsersResult> => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
  const query: Record<string, unknown> = { deletedAt: null };

  const clientFilter = toObjectIdOrNull(filters.clientId);
  if (clientFilter !== undefined) {
    query.clientId = clientFilter;
  }
  if (filters.role) {
    query.role = filters.role;
  }
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.search) {
    const regex = new RegExp(filters.search, 'i');
    query.$or = [{ email: regex }, { fullName: regex }];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(query),
  ]);

  return {
    items: items.map((u) => sanitizeUser(u as IUser)),
    page,
    limit,
    total,
  };
};

export const getUserById = async (id: string, clientId?: string | null): Promise<IUser | null> => {
  if (!isValidObjectId(id)) {
    throw buildError(400, 'INVALID_ID', 'ID inválido');
  }

  const query: Record<string, unknown> = { _id: id, deletedAt: null };
  const clientFilter = toObjectIdOrNull(clientId);
  if (clientFilter !== undefined) {
    query.clientId = clientFilter;
  }

  const user = await User.findOne(query).lean();
  if (!user) return null;
  return sanitizeUser(user as IUser);
};

export const updateUser = async (
  id: string,
  updates: UpdateUserInput,
  clientId?: string | null
): Promise<IUser | null> => {
  if (!isValidObjectId(id)) {
    throw buildError(400, 'INVALID_ID', 'ID inválido');
  }

  const query: Record<string, unknown> = { _id: id, deletedAt: null };
  const clientFilter = toObjectIdOrNull(clientId);
  if (clientFilter !== undefined) {
    query.clientId = clientFilter;
  }

  const current = await User.findOne(query).lean();
  if (!current) return null;

  const updatePayload: Record<string, unknown> = {};
  if (updates.fullName !== undefined) updatePayload.fullName = updates.fullName;
  if (updates.role !== undefined) updatePayload.role = updates.role;
  if (updates.status !== undefined) updatePayload.status = updates.status;
  if (updates.phone !== undefined) updatePayload.phone = updates.phone;
  if (updates.locale !== undefined) updatePayload.locale = updates.locale;
  if (updates.updatedBy) {
    if (!isValidObjectId(updates.updatedBy)) {
      throw buildError(400, 'INVALID_UPDATED_BY', 'updatedBy inválido');
    }
    updatePayload.updatedBy = new Types.ObjectId(updates.updatedBy);
  }

  if (updates.password) {
    updatePayload.passwordHash = await hashPassword(updates.password);
  }

  const targetClientId = current.clientId ?? null;
  const willLoseAdminRole = current.role === 'admin' && updates.role && updates.role !== 'admin';
  const willDisable = current.role === 'admin' && updates.status && updates.status !== 'active';
  if (willLoseAdminRole || willDisable) {
    await ensureAnotherAdminExists(targetClientId, id);
  }

  const updated = await User.findOneAndUpdate(query, updatePayload, { new: true }).lean();
  if (!updated) return null;
  return sanitizeUser(updated as IUser);
};

export const softDeleteUser = async (id: string, clientId?: string | null): Promise<boolean> => {
  if (!isValidObjectId(id)) {
    throw buildError(400, 'INVALID_ID', 'ID inválido');
  }

  const query: Record<string, unknown> = { _id: id, deletedAt: null };
  const clientFilter = toObjectIdOrNull(clientId);
  if (clientFilter !== undefined) {
    query.clientId = clientFilter;
  }

  const current = await User.findOne(query).lean();
  if (!current) return false;

  await ensureAnotherAdminExists(current.clientId ?? null, id);

  const result = await User.findOneAndUpdate(query, { status: 'deleted', deletedAt: new Date() }, { new: true }).lean();

  return Boolean(result);
};
