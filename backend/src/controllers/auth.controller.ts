import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import type { AuthUser } from '../models/auth.model.js';
import { logLoginAttempt } from '../services/login-attempt.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_no_usar_en_produccion';

// JWT payload interface with type discriminator
export interface TokenPayload {
    id: string;
    role: 'super-admin' | 'admin' | 'operator' | 'viewer';
    clientId: string | null;
    tenantId: string | null;
    email?: string;
    type: 'access' | 'refresh';
}

/**
 * Signs an access token with 15-minute expiration
 */
export const signAccessToken = (payload: Omit<TokenPayload, 'type'>): string => {
    return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET, { expiresIn: '15m' });
};

/**
 * Signs a refresh token with 7-day expiration
 */
export const signRefreshToken = (payload: Omit<TokenPayload, 'type'>): string => {
    return jwt.sign({ ...payload, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Decodes a token without verification (for inspection)
 */
export const decodeToken = (token: string): TokenPayload | null => {
    try {
        return jwt.decode(token) as TokenPayload | null;
    } catch {
        return null;
    }
};

/**
 * Verifies a token and returns the payload
 */
export const verifyToken = (token: string): TokenPayload => {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

/**
 * Sets both authentication cookies (access + refresh)
 */
export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Access token - 15 minutes
    res.cookie('token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes in ms
    });

    // Refresh token - 7 days
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });
};

/**
 * Clears both authentication cookies
 */
export const clearAuthCookies = (res: Response): void => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
};

/**
 * Creates a token payload from a user document
 */
const createPayload = (user: {
    _id: { toString: () => string };
    role: 'super-admin' | 'admin' | 'operator' | 'viewer';
    clientId?: { toString: () => string } | null;
    email?: string;
}): Omit<TokenPayload, 'type'> => {
    return {
        id: user._id.toString(),
        role: user.role,
        clientId: user.clientId ? user.clientId.toString() : null,
        tenantId: user.clientId ? user.clientId.toString() : null,
        email: user.email,
    };
};

/**
 * POST /api/auth/login - Authenticate user and issue tokens
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;
        const ip = req.ip ?? req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        if (!email || !password) {
            // Log missing fields attempt
            try {
                await logLoginAttempt({
                    email: email || '',
                    success: false,
                    reason: 'missing_fields',
                    ip,
                    userAgent,
                });
            } catch {
                // Continue even if logging fails
            }
            res.status(400).json({ success: false, message: 'Email y password son requeridos' });
            return;
        }

        const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null }).lean();
        if (!user || !user.passwordHash) {
            // Log invalid credentials attempt
            try {
                await logLoginAttempt({
                    email: email.toLowerCase(),
                    success: false,
                    reason: 'invalid_credentials',
                    ip,
                    userAgent,
                });
            } catch {
                // Continue even if logging fails
            }
            res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            return;
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            // Log invalid credentials attempt
            try {
                await logLoginAttempt({
                    email: email.toLowerCase(),
                    userId: user._id.toString(),
                    clientId: user.clientId?.toString() ?? null,
                    success: false,
                    reason: 'invalid_credentials',
                    ip,
                    userAgent,
                });
            } catch {
                // Continue even if logging fails
            }
            res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            return;
        }

        if (user.status !== 'active') {
            // Log inactive user attempt
            try {
                await logLoginAttempt({
                    email: email.toLowerCase(),
                    userId: user._id.toString(),
                    clientId: user.clientId?.toString() ?? null,
                    success: false,
                    reason: 'inactive_user',
                    ip,
                    userAgent,
                });
            } catch {
                // Continue even if logging fails
            }
            res.status(401).json({ success: false, message: 'Usuario no activo' });
            return;
        }

        // Update lastLoginAt before issuing token
        await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

        const basePayload = createPayload(user);
        const accessToken = signAccessToken(basePayload);
        const refreshToken = signRefreshToken(basePayload);

        setAuthCookies(res, accessToken, refreshToken);

        // Log successful login
        try {
            await logLoginAttempt({
                email: email.toLowerCase(),
                userId: user._id.toString(),
                clientId: user.clientId?.toString() ?? null,
                success: true,
                reason: 'success',
                ip,
                userAgent,
            });
        } catch {
            // Continue even if logging fails
        }

        const userData: AuthUser = {
            id: basePayload.id,
            role: basePayload.role,
            clientId: basePayload.clientId,
            tenantId: basePayload.tenantId,
            email: basePayload.email,
        };

        res.status(200).json({ success: true, message: 'Login exitoso', data: { user: userData } });
    } catch (err) {
        return next(err);
    }
};

/**
 * POST /api/auth/logout - Clear authentication cookies
 */
export const logout = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    clearAuthCookies(res);
    res.status(200).json({ success: true, message: 'Sesión cerrada' });
};

/**
 * POST /api/auth/refresh - Refresh access token using refresh token
 */
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            clearAuthCookies(res);
            res.status(401).json({ success: false, message: 'Token de refresh inválido o expirado' });
            return;
        }

        let decoded: TokenPayload;
        try {
            decoded = verifyToken(refreshToken);
        } catch {
            clearAuthCookies(res);
            res.status(401).json({ success: false, message: 'Token de refresh inválido o expirado' });
            return;
        }

        // Verify this is a refresh token
        if (decoded.type !== 'refresh') {
            clearAuthCookies(res);
            res.status(401).json({ success: false, message: 'Token de refresh inválido o expirado' });
            return;
        }

        // Validate user still exists and is active
        const user = await User.findById(decoded.id).lean();
        if (!user || user.status !== 'active' || user.deletedAt) {
            clearAuthCookies(res);
            res.status(401).json({ success: false, message: 'Token de refresh inválido o expirado' });
            return;
        }

        // Generate new tokens
        const basePayload = createPayload(user);
        const newAccessToken = signAccessToken(basePayload);
        const newRefreshToken = signRefreshToken(basePayload);

        setAuthCookies(res, newAccessToken, newRefreshToken);

        const userData: AuthUser = {
            id: basePayload.id,
            role: basePayload.role,
            clientId: basePayload.clientId,
            tenantId: basePayload.tenantId,
            email: basePayload.email,
        };

        res.status(200).json({ success: true, data: { user: userData } });
    } catch (err) {
        return next(err);
    }
};

/**
 * Validates password strength according to policy
 * Requirements: min 12 chars, at least one uppercase, lowercase, number, and symbol
 */
export const validatePasswordStrength = (password: string): string | null => {
    if (password.length < 12) {
        return 'La contraseña debe tener al menos 12 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
        return 'La contraseña debe contenir al menos una letra mayúscula';
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

/**
 * POST /api/auth/change-password - Self-service password change for authenticated users
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate required fields
        if (!currentPassword) {
            res.status(400).json({ success: false, message: 'La contraseña actual es requerida' });
            return;
        }
        if (!newPassword) {
            res.status(400).json({ success: false, message: 'La nueva contraseña es requerida' });
            return;
        }
        if (!confirmPassword) {
            res.status(400).json({ success: false, message: 'La confirmación de contraseña es requerida' });
            return;
        }

        // Validate password match
        if (newPassword !== confirmPassword) {
            res.status(400).json({ success: false, message: 'Las contraseñas no coinciden' });
            return;
        }

        // Validate password strength
        const strengthError = validatePasswordStrength(newPassword);
        if (strengthError) {
            res.status(400).json({ success: false, message: strengthError });
            return;
        }

        // Get user from request (set by auth middleware)
        const authUser = (req as { user?: AuthUser }).user;
        if (!authUser?.id) {
            res.status(401).json({ success: false, message: 'No autenticado' });
            return;
        }

        // Fetch current user record
        const user = await User.findById(authUser.id).lean();
        if (!user) {
            res.status(401).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }

        // Check user status
        if (user.status !== 'active') {
            res.status(401).json({ success: false, message: 'Usuario no activo' });
            return;
        }

        // Verify current password
        if (!user.passwordHash) {
            res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            return;
        }

        const match = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!match) {
            res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });
            return;
        }

        // Check new password is different from current
        const sameAsCurrent = await bcrypt.compare(newPassword, user.passwordHash);
        if (sameAsCurrent) {
            res.status(400).json({ success: false, message: 'La nueva contraseña debe ser diferente a la actual' });
            return;
        }

        // Hash new password and update
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        await User.findByIdAndUpdate(authUser.id, { passwordHash: newPasswordHash });

        res.status(200).json({ success: true, message: 'Contraseña actualizada' });
    } catch (err) {
        return next(err);
    }
};