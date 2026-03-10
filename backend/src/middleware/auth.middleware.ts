import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, AuthUser } from '../models/auth.model.js';

export const autenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const cookieToken = (req as any).cookies?.token as string | undefined;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    const token = cookieToken || bearerToken ;

    if (!token) {
        res.status(401).json({ success: false, message: 'No se proporcionó token' });
        return;
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'fallback_secret_no_usar_en_produccion'
        ) as AuthUser;
        if (!decoded || !decoded.id || !decoded.role) {
            return res.status(403).json({ success: false, message: 'Token inválido' });
        }

        const normalized: AuthUser = {
            id: decoded.id,
            role: decoded.role,
            clientId: decoded.clientId ?? null,
        };
        if (decoded.email !== undefined) {
            normalized.email = decoded.email;
        }

        req.user = normalized;
        next();
    } catch {
        res.status(403).json({ success: false, message: 'Token inválido o expirado' });
    }
};
