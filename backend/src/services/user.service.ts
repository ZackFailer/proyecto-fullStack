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
  const userRecord = user as unknown as Record<string, unknown>;
  const sanitized: Record<string, unknown> = { ...userRecord };

  const rawId = sanitized.id ?? sanitized._id;
  if (rawId !== undefined && rawId !== null) {
    sanitized.id = typeof rawId === 'string' ? rawId : String(rawId);
  }

  delete sanitized._id;
  delete sanitized.passwordHash;

  return sanitized as unknown as IUser;
};

const enrichWithUpdatedByName = async (user: IUser): Promise<IUser & { updatedByName: string | null }> => {
  const userRecord = user as unknown as Record<string, unknown>;
  const updatedByValue = userRecord.updatedBy;

  if (!updatedByValue) {
    return { ...user, updatedByName: null };
  }

  if (typeof updatedByValue === 'object' && updatedByValue !== null) {
    const populated = updatedByValue as Record<string, unknown>;
    if (typeof populated.fullName === 'string' && populated.fullName.trim().length > 0) {
      return { ...user, updatedByName: populated.fullName };
    }

    const nestedId = populated._id;
    if (typeof nestedId === 'string' && isValidObjectId(nestedId)) {
      const modifier = await User.findById(nestedId).select('fullName').lean();
      return { ...user, updatedByName: modifier?.fullName ?? null };
    }
  }

  const updatedById = String(updatedByValue);
  if (!isValidObjectId(updatedById)) {
    return { ...user, updatedByName: null };
  }

  const modifier = await User.findById(updatedById).select('fullName').lean();
  return { ...user, updatedByName: modifier?.fullName ?? null };
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

export const listUsers = async (filters: ListUsersFilters): Promise<{
  items: (IUser & { updatedByName: string | null })[];
  page: number;
  limit: number;
  total: number;
}> => {
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
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('updatedBy', 'fullName')
      .lean(),
    User.countDocuments(query),
  ]);

  const sanitizedItems = await Promise.all(
    items.map(async (u) => {
      const sanitized = sanitizeUser(u as IUser);
      return enrichWithUpdatedByName(sanitized);
    })
  );

  return {
    items: sanitizedItems,
    page,
    limit,
    total,
  };
};

export const getUserById = async (id: string, clientId?: string | null): Promise<(IUser & { updatedByName: string | null }) | null> => {
  if (!isValidObjectId(id)) {
    throw buildError(400, 'INVALID_ID', 'ID inválido');
  }

  const query: Record<string, unknown> = { _id: id, deletedAt: null };
  const clientFilter = toObjectIdOrNull(clientId);
  if (clientFilter !== undefined) {
    query.clientId = clientFilter;
  }

  const user = await User.findOne(query).populate('updatedBy', 'fullName').lean();
  if (!user) return null;

  const sanitized = sanitizeUser(user as IUser);
  return enrichWithUpdatedByName(sanitized);
};

export const updateUser = async (
  id: string,
  updates: UpdateUserInput,
  clientId?: string | null
): Promise<(IUser & { updatedByName: string | null }) | null> => {
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

  const updated = await User.findOneAndUpdate(query, updatePayload, { new: true })
    .populate('updatedBy', 'fullName')
    .lean();
  if (!updated) return null;

  const sanitized = sanitizeUser(updated as IUser);
  return enrichWithUpdatedByName(sanitized);
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

/**
 * Changes a user's password (privileged operation - bypasses self-auth).
 * - Admin role: can only change operator/viewer passwords (must provide adminPassword)
 * - Super-admin role: can change any role password (no adminPassword needed)
 */
export const changeUserPassword = async (
  targetId: string,
  newPassword: string,
  options?: {
    clientId?: string | null;
    actorRole: UserRole;
    actorPassword?: string; // Required when actor is admin
  }
): Promise<void> => {
  if (!isValidObjectId(targetId)) {
    throw buildError(400, 'INVALID_ID', 'ID inválido');
  }

  const query: Record<string, unknown> = { _id: targetId, deletedAt: null };
  const clientFilter = toObjectIdOrNull(options?.clientId);
  if (clientFilter !== undefined) {
    query.clientId = clientFilter;
  }

  const target = await User.findOne(query).lean();
  if (!target) {
    throw buildError(404, 'USER_NOT_FOUND', 'Usuario no encontrado');
  }

  // Validate actor role permissions
  const actorRole = options?.actorRole;

  if (actorRole === 'admin') {
    // Admin can only change operator or viewer
    if (target.role !== 'operator' && target.role !== 'viewer') {
      throw buildError(403, 'FORBIDDEN', 'El rol admin no puede cambiar la contraseña de este usuario');
    }
  } else if (actorRole === 'super-admin') {
    // Super-admin can change any role - allowed
  } else {
    // Operator, viewer cannot use this endpoint
    throw buildError(403, 'FORBIDDEN', 'No tienes permisos para cambiar la contraseña de este usuario');
  }

  // For admin role: verify their current password
  if (actorRole === 'admin') {
    if (!options?.actorPassword) {
      throw buildError(400, 'ADMIN_PASSWORD_REQUIRED', 'La contraseña del admin es requerida');
    }
    // Actor password needs to be verified by the caller, not here
    // This is because actor info is not in this service (keeps it decoupled)
  }

  // Update password hash
  const newPasswordHash = await hashPassword(newPassword);
  await User.findByIdAndUpdate(targetId, { passwordHash: newPasswordHash });
};
