import { NextFunction, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../models/auth.model.js';
import { User } from '../models/user.model.js';
import { validatePasswordStrength } from './auth.controller.js';
import {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  softDeleteUser,
  changeUserPassword,
  CreateUserInput,
  UpdateUserInput,
  ListUsersFilters,
} from '../services/user.service.js';

type UserRole = 'super-admin' | 'admin' | 'operator' | 'viewer';

interface ScopeContext {
  type: 'global' | 'tenant';
  clientId: string | null;
  tenantId?: string;
}

/**
 * Derives scope from route parameters ONLY.
 * - If tenantId is in params, it's tenant scope.
 * - Otherwise, it's global scope.
 * Does NOT trust query/body for scope determination.
 */
const getScopeContext = (req: AuthRequest): ScopeContext => {
  const routeTenantId = req.params.tenantId;

  if (routeTenantId) {
    // Tenant-scoped: /api/tenants/:tenantId/users
    if (!isValidObjectId(routeTenantId)) {
      throw { status: 400, code: 'INVALID_TENANT_ID', message: 'ID de tenant inválido' };
    }
    return {
      type: 'tenant',
      clientId: routeTenantId,
      tenantId: routeTenantId,
    };
  }

  // Global: /api/users
  return {
    type: 'global',
    clientId: null,
  };
};

/**
 * Checks if the actor can perform mutations (create/update/delete/status).
 * - Global scope: only super-admin can mutate
 * - Tenant scope: only admin can mutate (super-admin is FORBIDDEN in tenant scope per requirements)
 */
const canMutate = (scopeType: 'global' | 'tenant', actorRole: UserRole): boolean => {
  if (scopeType === 'global') {
    return actorRole === 'super-admin';
  }
  // Tenant scope: super-admin (admin-view mode) and tenant admin can mutate.
  return actorRole === 'admin' || actorRole === 'super-admin';
};

/**
 * Validates that the actor has access to the scope.
 * - Global scope: requires super-admin role
 * - Tenant scope: requires any authenticated user (tenantContext middleware already validates tenant access)
 */
const canAccessScope = (scopeType: 'global' | 'tenant', actorRole: UserRole): boolean => {
  if (scopeType === 'global') {
    return actorRole === 'super-admin';
  }
  // Tenant scope: any authenticated user with valid tenant context can access (read/mutate based on role)
  return ['super-admin', 'admin', 'operator', 'viewer'].includes(actorRole);
};

/**
 * Validates role restrictions for tenant-scoped mutations.
 * - Cannot set role to super-admin in tenant scope
 * - Only admin can mutate
 */
const validateTenantRole = (
  scopeType: 'global' | 'tenant',
  targetRole: UserRole | undefined,
  actorRole: UserRole
): { allowed: boolean; reason?: string } => {
  // In tenant scope, super-admin role is forbidden
  if (scopeType === 'tenant' && targetRole === 'super-admin') {
    return { allowed: false, reason: 'No se puede asignar rol super-admin en scope de tenant' };
  }

  // In tenant scope, only tenant admin or super-admin (tenant view) can mutate.
  if (scopeType === 'tenant' && actorRole !== 'admin' && actorRole !== 'super-admin') {
    return { allowed: false, reason: 'Solo el rol admin puede realizar mutaciones en tenant' };
  }

  return { allowed: true };
};

export const createUserHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const scope = getScopeContext(req);
    const actorRole = req.user?.role as UserRole;
    const actorId = req.user?.id;

    // Check scope access
    if (!canAccessScope(scope.type, actorRole)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: scope.type === 'global' 
          ? 'Solo super-admin puede acceder a usuarios globales' 
          : 'No autorizado para este tenant',
      });
    }

    // Check mutation permission
    if (!canMutate(scope.type, actorRole)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: scope.type === 'global'
          ? 'Solo super-admin puede crear usuarios globales'
          : 'Solo el rol admin puede crear usuarios en el tenant',
      });
    }

    // Validate role restrictions
    const targetRole = req.body.role as UserRole;
    const roleValidation = validateTenantRole(scope.type, targetRole, actorRole);
    if (!roleValidation.allowed) {
      return res.status(400).json({
        success: false,
        code: 'FORBIDDEN_ROLE',
        message: roleValidation.reason,
      });
    }

    // Global scope: only allow creating super-admin role
    if (scope.type === 'global' && targetRole !== 'super-admin') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ROLE',
        message: 'En scope global solo se pueden crear usuarios con rol super-admin',
      });
    }

    const payload: CreateUserInput = {
      clientId: scope.clientId,
      email: req.body.email,
      fullName: req.body.fullName,
      role: targetRole,
    };

    if (req.body.password !== undefined) payload.password = req.body.password;
    if (req.body.status !== undefined) payload.status = req.body.status;
    if (req.body.phone !== undefined) payload.phone = req.body.phone;
    if (req.body.locale !== undefined) payload.locale = req.body.locale;
    if (actorId) payload.createdBy = actorId;

    const user = await createUser(payload);
    return res.status(201).json({ success: true, message: 'Usuario creado', data: user });
  } catch (err) {
    return next(err);
  }
};

export const listUsersHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const scope = getScopeContext(req);
    const actorRole = req.user?.role as UserRole;

    // Check scope access
    if (!canAccessScope(scope.type, actorRole)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: scope.type === 'global'
          ? 'Solo super-admin puede acceder a usuarios globales'
          : 'No autorizado para este tenant',
      });
    }

    // Global scope: enforce clientId=null (no tenant) and role=super-admin
    let filters: ListUsersFilters = { clientId: scope.clientId };

    if (scope.type === 'global') {
      // Only super-admin users without clientId
      filters.clientId = null;
      filters.role = 'super-admin';
    }

    if (scope.type === 'tenant' && req.query.role !== undefined) filters.role = req.query.role as any;
    if (req.query.status !== undefined) filters.status = req.query.status as any;
    if (req.query.search !== undefined) filters.search = String(req.query.search);
    if (req.query.page !== undefined) filters.page = Number(req.query.page);
    if (req.query.limit !== undefined) filters.limit = Number(req.query.limit);

    const result = await listUsers(filters);
    return res.status(200).json({ success: true, message: 'Usuarios obtenidos', data: result });
  } catch (err) {
    return next(err);
  }
};

export const getUserHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const scope = getScopeContext(req);
    const actorRole = req.user?.role as UserRole;

    // Check scope access
    if (!canAccessScope(scope.type, actorRole)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: scope.type === 'global'
          ? 'Solo super-admin puede acceder a usuarios globales'
          : 'No autorizado para este tenant',
      });
    }

    const id = typeof req.params.id === 'string' ? req.params.id : undefined;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ success: false, code: 'INVALID_ID', message: 'ID inválido' });
    }

    // Global scope: only allow getting super-admin users without clientId
    let clientIdFilter: string | null = scope.clientId;
    if (scope.type === 'global') {
      clientIdFilter = null;
    }

    const user = await getUserById(id, clientIdFilter);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Additional check for global scope: verify the user is super-admin
    if (scope.type === 'global' && user.role !== 'super-admin') {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    return res.status(200).json({ success: true, message: 'Usuario obtenido', data: user });
  } catch (err) {
    return next(err);
  }
};

export const updateUserHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const scope = getScopeContext(req);
    const actorRole = req.user?.role as UserRole;
    const actorId = req.user?.id;

    // Check scope access
    if (!canAccessScope(scope.type, actorRole)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: scope.type === 'global'
          ? 'Solo super-admin puede acceder a usuarios globales'
          : 'No autorizado para este tenant',
      });
    }

    // Check mutation permission
    if (!canMutate(scope.type, actorRole)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: scope.type === 'global'
          ? 'Solo super-admin puede actualizar usuarios globales'
          : 'Solo el rol admin puede actualizar usuarios en el tenant',
      });
    }

    const id = typeof req.params.id === 'string' ? req.params.id : undefined;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ success: false, code: 'INVALID_ID', message: 'ID inválido' });
    }

    // Validate role restrictions
    const targetRole = req.body.role as UserRole;
    const roleValidation = validateTenantRole(scope.type, targetRole, actorRole);
    if (!roleValidation.allowed) {
      return res.status(400).json({
        success: false,
        code: 'FORBIDDEN_ROLE',
        message: roleValidation.reason,
      });
    }

    // Global scope: only allow updating to super-admin role
    if (scope.type === 'global' && targetRole && targetRole !== 'super-admin') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ROLE',
        message: 'En scope global solo se puede asignar rol super-admin',
      });
    }

    // Global scope: only allow updating users without clientId
    let clientIdFilter: string | null = scope.clientId;
    if (scope.type === 'global') {
      clientIdFilter = null;
    }

    const updates: UpdateUserInput = {};
    if (req.body.fullName !== undefined) updates.fullName = req.body.fullName;
    if (req.body.role !== undefined) updates.role = req.body.role;
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.locale !== undefined) updates.locale = req.body.locale;
    if (req.body.password !== undefined) updates.password = req.body.password;
    if (actorId) updates.updatedBy = actorId;

    const user = await updateUser(id, updates, clientIdFilter);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Additional check for global scope: verify the user is super-admin
    if (scope.type === 'global' && user.role !== 'super-admin') {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    return res.status(200).json({ success: true, message: 'Usuario actualizado', data: user });
  } catch (err) {
    return next(err);
  }
};

export const deleteUserHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const scope = getScopeContext(req);
    const actorRole = req.user?.role as UserRole;

    // Check scope access
    if (!canAccessScope(scope.type, actorRole)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: scope.type === 'global'
          ? 'Solo super-admin puede acceder a usuarios globales'
          : 'No autorizado para este tenant',
      });
    }

    // Check mutation permission
    if (!canMutate(scope.type, actorRole)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: scope.type === 'global'
          ? 'Solo super-admin puede eliminar usuarios globales'
          : 'Solo el rol admin puede eliminar usuarios en el tenant',
      });
    }

    const id = typeof req.params.id === 'string' ? req.params.id : undefined;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ success: false, code: 'INVALID_ID', message: 'ID inválido' });
    }

    // Global scope: only allow deleting users without clientId
    let clientIdFilter: string | null = scope.clientId;
    if (scope.type === 'global') {
      clientIdFilter = null;
    }

    const deleted = await softDeleteUser(id, clientIdFilter);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    return res.status(200).json({ success: true, message: 'Usuario eliminado', data: null });
  } catch (err) {
    return next(err);
  }
};

/**
 * changePasswordHandler - Privileged password change (admin or superadmin changes user's password).
 * - Global scope (/api/users/:id/change-password): superadmin only
 * - Tenant scope (/api/tenants/:tenantId/users/:id/change-password): admin or superadmin
 */
export const changePasswordHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const scope = getScopeContext(req);
    const actorRole = req.user?.role as UserRole;
    const actorId = req.user?.id;

    // Global scope: super-admin only
    if (scope.type === 'global' && actorRole !== 'super-admin') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Solo super-admin puede cambiar contraseñas en scope global',
      });
    }

    // Tenant scope: admin or super-admin only
    if (scope.type === 'tenant' && actorRole !== 'admin' && actorRole !== 'super-admin') {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'No tienes permisos para cambiar la contraseña de otros usuarios',
      });
    }

    const targetId = typeof req.params.id === 'string' ? req.params.id : undefined;
    if (!targetId || !isValidObjectId(targetId)) {
      return res.status(400).json({ success: false, code: 'INVALID_ID', message: 'ID inválido' });
    }

    const { adminPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (actorRole === 'admin') {
      // Admin must provide their own password
      if (!adminPassword) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña del admin es requerida',
        });
      }
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña es requerida',
      });
    }
    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'La confirmación de contraseña es requerida',
      });
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden' });
    }

    // Validate password strength
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) {
      return res.status(400).json({ success: false, message: strengthError });
    }

    // For admin: verify their current password against stored hash
    if (actorRole === 'admin' && adminPassword) {
      const actor = await User.findOne({ _id: actorId, deletedAt: null }).lean();
      if (!actor || !actor.passwordHash) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      }
      const match = await bcrypt.compare(adminPassword, actor.passwordHash);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Contraseña del admin incorrecta' });
      }
    }

    // Determine scope clientId for target user query
    let clientIdFilter: string | null = scope.clientId;
    if (scope.type === 'global') {
      clientIdFilter = null;
    }

    // Call service (validates role permissions and updates password)
    await changeUserPassword(targetId, newPassword, {
      clientId: clientIdFilter,
      actorRole,
    });

    return res.status(200).json({ success: true, message: 'Contraseña actualizada' });
  } catch (err) {
    return next(err);
  }
};
