import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';

const signToken = (payload: object) => {
    const secret = process.env.JWT_SECRET || 'fallback_secret_no_usar_en_produccion';
    return jwt.sign(payload, secret, { expiresIn: '1h' });
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email y password son requeridos' });
            return;
        }

        const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null }).lean();
        if (!user || !user.passwordHash) {
            res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            return;
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            res.status(401).json({ success: false, message: 'Credenciales inválidas' });
            return;
        }

        const payload = {
            id: user._id?.toString(),
            role: user.role,
            clientId: user.clientId ? user.clientId.toString() : null,
            email: user.email,
        };

        const token = signToken(payload);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' || false,
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000,
        });

        res.status(200).json({ success: true, message: 'Login exitoso', data: { user: payload } });
    } catch (err) {
        return next(err);
    }
};
