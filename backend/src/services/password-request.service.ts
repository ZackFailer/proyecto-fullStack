import { isValidObjectId, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { PasswordChangeRequest, IPasswordChangeRequest } from '../models/password-change-request.model.js';
import { User } from '../models/user.model.js';

export interface ServiceError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export interface CreatePasswordChangeRequestInput {
  requesterId: string;
  targetUserId: string;
  tenantId?: string | null;
  reason?: string;
}

export interface ListPasswordChangeRequestsFilters {
  tenantId?: string | null;
  status?: 'pending' | 'completed' | 'rejected';
  page?: number;
  limit?: number;
}

export interface ResolvePasswordChangeRequestInput {
  requestId: string;
  resolvedBy: string;
  newPassword: string;
  confirmPassword: string;
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

/**
 * Validates password strength according to policy
 * Requirements: min 12 chars, at least one uppercase, lowercase, number, and symbol
 */
const validatePasswordStrength = (password: string): string | null => {
  if (password.length < 12) {
    return 'La contraseña debe tener al menos 12 caracteres';
  }
  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe contener al menos una letra mayúscula';
  }
  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe contener al menos una letra minúscula';
  }
  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe contener al menos un número';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'La contraseña debe contener al menos un símbolo';
  }
  return null;
};

const toObjectIdOrNull = (value?: string | null): Types.ObjectId | null | undefined => {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (!isValidObjectId(value)) {
    throw buildError(400, 'INVALID_ID', 'ID inválido');
  }
  return new Types.ObjectId(value);
};

/**
 * Creates a password change request
 * Actor: admin (only can request for operator/viewer)
 */
export const createPasswordChangeRequest = async (payload: CreatePasswordChangeRequestInput): Promise<IPasswordChangeRequest> => {
  const { requesterId, targetUserId, tenantId, reason } = payload;

  if (!isValidObjectId(requesterId)) {
    throw buildError(400, 'INVALID_ID', 'ID del solicitante inválido');
  }

  if (!isValidObjectId(targetUserId)) {
    throw buildError(400, 'INVALID_ID', 'ID del usuario objetivo inválido');
  }

  // Fetch requester to verify role
  const requester = await User.findById(requesterId).lean();
  if (!requester) {
    throw buildError(404, 'REQUESTER_NOT_FOUND', 'Solicitante no encontrado');
  }

  // Only admin and super-admin can create requests
  if (requester.role !== 'admin' && requester.role !== 'super-admin') {
    throw buildError(403, 'FORBIDDEN', 'No tienes permisos para crear solicitudes de cambio de contraseña');
  }

  // Fetch target user
  const target = await User.findById(targetUserId).lean();
  if (!target) {
    throw buildError(404, 'TARGET_NOT_FOUND', 'Usuario objetivo no encontrado');
  }

  // Admin can only request for operator or viewer
  if (requester.role === 'admin') {
    if (target.role !== 'operator' && target.role !== 'viewer') {
      throw buildError(403, 'FORBIDDEN', 'El rol admin no puede solicitar cambio de contraseña para este usuario');
    }

    // Verify same tenant
    if (requester.clientId?.toString() !== target.clientId?.toString()) {
      throw buildError(403, 'FORBIDDEN', 'No puedes solicitar cambio de contraseña para usuarios de otro tenant');
    }
  }

  // Can't request password change for yourself
  if (requesterId === targetUserId) {
    throw buildError(400, 'SELF_REQUEST', 'No puedes solicitar cambio de contraseña para ti mismo');
  }

  const clientId = tenantId !== undefined ? toObjectIdOrNull(tenantId) : requester.clientId;

  const passwordChangeRequest = new PasswordChangeRequest({
    requesterUserId: new Types.ObjectId(requesterId),
    targetUserId: new Types.ObjectId(targetUserId),
    tenantId: clientId,
    reason,
    status: 'pending',
  });

  const saved = await passwordChangeRequest.save();
  return saved;
};

/**
 * Lists password change requests
 * Actor: superadmin (can see all), admin (can see only their tenant's pending)
 */
export const listPasswordChangeRequests = async (
  filters: ListPasswordChangeRequestsFilters,
  actorId: string
): Promise<{
  items: IPasswordChangeRequest[];
  page: number;
  limit: number;
  total: number;
}> => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));

  if (!isValidObjectId(actorId)) {
    throw buildError(400, 'INVALID_ID', 'ID del actor inválido');
  }

  // Fetch actor to verify role
  const actor = await User.findById(actorId).lean();
  if (!actor) {
    throw buildError(404, 'ACTOR_NOT_FOUND', 'Actor no encontrado');
  }

  const query: Record<string, unknown> = {};

  // Filter by status if provided
  if (filters.status) {
    query.status = filters.status;
  }

  // Super-admin sees all, admin sees only their tenant
  if (actor.role === 'super-admin') {
    // Can filter by tenant if provided
    if (filters.tenantId) {
      const tenantId = toObjectIdOrNull(filters.tenantId);
      if (tenantId) {
        query.tenantId = tenantId;
      }
    }
  } else if (actor.role === 'admin') {
    // Admin sees only their tenant's requests
    if (actor.clientId) {
      query.tenantId = actor.clientId;
    } else {
      query.tenantId = null;
    }
  } else {
    throw buildError(403, 'FORBIDDEN', 'No tienes permisos para ver solicitudes de cambio de contraseña');
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    PasswordChangeRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('requesterUserId', 'fullName email')
      .populate('targetUserId', 'fullName email')
      .populate('resolvedBy', 'fullName email')
      .lean(),
    PasswordChangeRequest.countDocuments(query),
  ]);

  return {
    items: items as IPasswordChangeRequest[],
    page,
    limit,
    total,
  };
};

/**
 * Resolves a password change request (approves and changes password)
 * Actor: superadmin only
 */
export const resolvePasswordChangeRequest = async (payload: ResolvePasswordChangeRequestInput): Promise<IPasswordChangeRequest> => {
  const { requestId, resolvedBy, newPassword, confirmPassword } = payload;

  if (!isValidObjectId(requestId)) {
    throw buildError(400, 'INVALID_ID', 'ID de solicitud inválido');
  }

  if (!isValidObjectId(resolvedBy)) {
    throw buildError(400, 'INVALID_ID', 'ID del resolutor inválido');
  }

  // Validate passwords match
  if (newPassword !== confirmPassword) {
    throw buildError(400, 'PASSWORDS_MISMATCH', 'Las contraseñas no coinciden');
  }

  // Validate password strength
  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) {
    throw buildError(400, 'WEAK_PASSWORD', strengthError);
  }

  // Fetch resolver to verify role
  const resolver = await User.findById(resolvedBy).lean();
  if (!resolver) {
    throw buildError(404, 'RESOLVER_NOT_FOUND', 'Resolutor no encontrado');
  }

  if (resolver.role !== 'super-admin') {
    throw buildError(403, 'FORBIDDEN', 'Solo super-admin puede resolver solicitudes de cambio de contraseña');
  }

  // Fetch the request
  const passwordChangeRequest = await PasswordChangeRequest.findById(requestId).lean();
  if (!passwordChangeRequest) {
    throw buildError(404, 'REQUEST_NOT_FOUND', 'Solicitud no encontrada');
  }

  if (passwordChangeRequest.status !== 'pending') {
    throw buildError(400, 'ALREADY_RESOLVED', 'La solicitud ya ha sido resuelta');
  }

  // Fetch target user
  const target = await User.findById(passwordChangeRequest.targetUserId).lean();
  if (!target) {
    throw buildError(404, 'TARGET_NOT_FOUND', 'Usuario objetivo no encontrado');
  }

  // Hash new password and update target user
  const salt = await bcrypt.genSalt(10);
  const newPasswordHash = await bcrypt.hash(newPassword, salt);

  await User.findByIdAndUpdate(target._id, { passwordHash: newPasswordHash });

  // Update request status
  const updated = await PasswordChangeRequest.findByIdAndUpdate(
    requestId,
    {
      status: 'completed',
      resolvedBy: new Types.ObjectId(resolvedBy),
    },
    { new: true }
  )
    .populate('requesterUserId', 'fullName email')
    .populate('targetUserId', 'fullName email')
    .populate('resolvedBy', 'fullName email')
    .lean();

  if (!updated) {
    throw buildError(500, 'UPDATE_FAILED', 'Error al actualizar la solicitud');
  }

  return updated as IPasswordChangeRequest;
};

/**
 * Rejects a password change request
 * Actor: superadmin only
 */
export const rejectPasswordChangeRequest = async (
  requestId: string,
  resolvedBy: string
): Promise<IPasswordChangeRequest> => {
  if (!isValidObjectId(requestId)) {
    throw buildError(400, 'INVALID_ID', 'ID de solicitud inválido');
  }

  if (!isValidObjectId(resolvedBy)) {
    throw buildError(400, 'INVALID_ID', 'ID del resolutor inválido');
  }

  // Fetch resolver to verify role
  const resolver = await User.findById(resolvedBy).lean();
  if (!resolver) {
    throw buildError(404, 'RESOLVER_NOT_FOUND', 'Resolutor no encontrado');
  }

  if (resolver.role !== 'super-admin') {
    throw buildError(403, 'FORBIDDEN', 'Solo super-admin puede rechazar solicitudes de cambio de contraseña');
  }

  // Fetch the request
  const passwordChangeRequest = await PasswordChangeRequest.findById(requestId).lean();
  if (!passwordChangeRequest) {
    throw buildError(404, 'REQUEST_NOT_FOUND', 'Solicitud no encontrada');
  }

  if (passwordChangeRequest.status !== 'pending') {
    throw buildError(400, 'ALREADY_RESOLVED', 'La solicitud ya ha sido resuelta');
  }

  // Update request status
  const updated = await PasswordChangeRequest.findByIdAndUpdate(
    requestId,
    {
      status: 'rejected',
      resolvedBy: new Types.ObjectId(resolvedBy),
    },
    { new: true }
  )
    .populate('requesterUserId', 'fullName email')
    .populate('targetUserId', 'fullName email')
    .populate('resolvedBy', 'fullName email')
    .lean();

  if (!updated) {
    throw buildError(500, 'UPDATE_FAILED', 'Error al actualizar la solicitud');
  }

  return updated as IPasswordChangeRequest;
};