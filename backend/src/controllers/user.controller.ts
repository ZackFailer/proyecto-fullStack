import { NextFunction, Response } from 'express';
import { AuthRequest } from '../models/auth.model.js';
import {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  softDeleteUser,
  CreateUserInput,
  UpdateUserInput,
  ListUsersFilters,
} from '../services/user.service.js';

const resolveClientId = (req: AuthRequest, fallback?: string | null): string | null | undefined => {
  const authUser = req.user;
  if (!authUser) return fallback;

  const routeTenant = typeof req.params.tenantId === 'string' ? req.params.tenantId : undefined;
  const queryTenant = typeof req.query.tenantId === 'string' ? req.query.tenantId : undefined;
  const bodyTenant = typeof req.body?.tenantId === 'string' ? req.body.tenantId : undefined;
  const bodyClient = typeof req.body?.clientId === 'string' ? req.body.clientId : undefined;
  const queryClient = typeof req.query?.clientId === 'string' ? req.query.clientId : undefined;

  // No super-admin: fuerza el clientId del token
  if (authUser.role !== 'super-admin') {
    return authUser.tenantId ?? authUser.clientId ?? null;
  }

  // Super-admin: permite enviar clientId (query/body) o usar el suyo
  return (
    routeTenant ??
    queryTenant ??
    bodyTenant ??
    queryClient ??
    bodyClient ??
    authUser.tenantId ??
    authUser.clientId ??
    fallback
  );
};

export const createUserHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const clientId: string | null = resolveClientId(req, null) ?? null;
    const payload: CreateUserInput = { clientId, email: req.body.email, fullName: req.body.fullName, role: req.body.role };

    if (req.body.password !== undefined) payload.password = req.body.password;
    if (req.body.status !== undefined) payload.status = req.body.status;
    if (req.body.phone !== undefined) payload.phone = req.body.phone;
    if (req.body.locale !== undefined) payload.locale = req.body.locale;
    if (req.user?.id) payload.createdBy = req.user.id;

    // Si no es super-admin, no permitir crear usuarios para otros tenants
    if (req.user?.role !== 'super-admin' && req.body.clientId && req.body.clientId !== clientId) {
      return res.status(403).json({ success: false, message: 'No autorizado para asignar otro cliente' });
    }

    // Si es super-admin creando usuario no-super-admin, clientId es obligatorio
    if (req.user?.role === 'super-admin' && payload.role !== 'super-admin' && !payload.clientId) {
      return res.status(400).json({ success: false, message: 'clientId es requerido para el usuario' });
    }

    const user = await createUser(payload);
    return res.status(201).json({ success: true, message: 'Usuario creado', data: user });
  } catch (err) {
    return next(err);
  }
};

export const listUsersHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const clientId: string | null = resolveClientId(req, null) ?? null;
    const filters: ListUsersFilters = { clientId };

    if (req.query.role !== undefined) filters.role = req.query.role as any;
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
    const clientId: string | null | undefined = resolveClientId(req, undefined);
    const id = typeof req.params.id === 'string' ? req.params.id : undefined;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const user = await getUserById(id, clientId ?? null);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    return res.status(200).json({ success: true, message: 'Usuario obtenido', data: user });
  } catch (err) {
    return next(err);
  }
};

export const updateUserHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const clientId: string | null | undefined = resolveClientId(req, undefined);
    const id = typeof req.params.id === 'string' ? req.params.id : undefined;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    if (req.body.clientId && req.body.clientId !== clientId) {
      return res.status(403).json({ success: false, message: 'No se permite cambiar el clientId' });
    }

    const updates: UpdateUserInput = {};
    if (req.body.fullName !== undefined) updates.fullName = req.body.fullName;
    if (req.body.role !== undefined) updates.role = req.body.role;
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.locale !== undefined) updates.locale = req.body.locale;
    if (req.body.password !== undefined) updates.password = req.body.password;
    if (req.user?.id) updates.updatedBy = req.user.id;

    const user = await updateUser(id, updates, clientId ?? null);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    return res.status(200).json({ success: true, message: 'Usuario actualizado', data: user });
  } catch (err) {
    return next(err);
  }
};

export const deleteUserHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const clientId: string | null | undefined = resolveClientId(req, undefined);
    const id = typeof req.params.id === 'string' ? req.params.id : undefined;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const deleted = await softDeleteUser(id, clientId ?? null);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    return res.status(200).json({ success: true, message: 'Usuario eliminado', data: null });
  } catch (err) {
    return next(err);
  }
};
