import { Router } from 'express';
import { autenticate } from '../middleware/auth.middleware.js';
import {
    createPasswordChangeRequest,
    listPasswordChangeRequests,
    resolvePasswordChangeRequest,
    rejectPasswordChangeRequest,
} from '../services/password-request.service.js';
import type { AuthUser } from '../models/auth.model.js';

/**
 * POST /api/password-change-requests - Create a password change request
 * Actor: admin only
 */
const createRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authUser = (req as { user?: AuthUser }).user;
        if (!authUser?.id) {
            res.status(401).json({ success: false, message: 'No autenticado' });
            return;
        }

        const { targetUserId, reason } = req.body;

        if (!targetUserId) {
            res.status(400).json({ success: false, message: 'targetUserId es requerido' });
            return;
        }

        const result = await createPasswordChangeRequest({
            requesterId: authUser.id,
            targetUserId,
            tenantId: authUser.clientId,
            reason,
        });

        res.status(201).json({
            success: true,
            message: 'Solicitud de cambio de contraseña creada',
            data: result,
        });
    } catch (err) {
        return next(err);
    }
};

/**
 * GET /api/password-change-requests - List password change requests
 * Actor: admin/superadmin only
 */
const listRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authUser = (req as { user?: AuthUser }).user;
        if (!authUser?.id) {
            res.status(401).json({ success: false, message: 'No autenticado' });
            return;
        }

        const { status, page, limit, tenantId } = req.query;

        const result = await listPasswordChangeRequests(
            {
                status: status as 'pending' | 'completed' | 'rejected' | undefined,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                tenantId: tenantId as string | undefined,
            },
            authUser.id
        );

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        return next(err);
    }
};

/**
 * PATCH /api/password-change-requests/:id/resolve - Resolve a password change request
 * Actor: superadmin only
 */
const resolveRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authUser = (req as { user?: AuthUser }).user;
        if (!authUser?.id) {
            res.status(401).json({ success: false, message: 'No autenticado' });
            return;
        }

        const { id } = req.params;
        const { newPassword, confirmPassword } = req.body;

        if (!newPassword) {
            res.status(400).json({ success: false, message: 'newPassword es requerido' });
            return;
        }
        if (!confirmPassword) {
            res.status(400).json({ success: false, message: 'confirmPassword es requerido' });
            return;
        }

        const result = await resolvePasswordChangeRequest({
            requestId: id,
            resolvedBy: authUser.id,
            newPassword,
            confirmPassword,
        });

        res.status(200).json({
            success: true,
            message: 'Solicitud de cambio de contraseña resuelta',
            data: result,
        });
    } catch (err) {
        return next(err);
    }
};

/**
 * PATCH /api/password-change-requests/:id/reject - Reject a password change request
 * Actor: superadmin only
 */
const rejectRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authUser = (req as { user?: AuthUser }).user;
        if (!authUser?.id) {
            res.status(401).json({ success: false, message: 'No autenticado' });
            return;
        }

        const { id } = req.params;

        const result = await rejectPasswordChangeRequest(id, authUser.id);

        res.status(200).json({
            success: true,
            message: 'Solicitud de cambio de contraseña rechazada',
            data: result,
        });
    } catch (err) {
        return next(err);
    }
};

import { Request } from 'express';

const router = Router();

router.post('/', autenticate, createRequest);
router.get('/', autenticate, listRequests);
router.patch('/:id/resolve', autenticate, resolveRequest);
router.patch('/:id/reject', autenticate, rejectRequest);

export default router;