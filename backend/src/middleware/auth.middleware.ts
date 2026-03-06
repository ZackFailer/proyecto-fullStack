import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {AuthRequest} from '../models/auth.model.js'

export const autenticate = (
    req:AuthRequest, res:Response, next:NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({message: 'No se proporcionó token'});
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({message: 'Token mal formado'});
        return;
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'fallback_secret_no_usar_en_produccion'
        );
        req.user = decoded;
        next();        
    } catch {
        res.status(403).json({ message: 'Token inválido o expirado' });
    }

}
