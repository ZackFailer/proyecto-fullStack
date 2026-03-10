import { Request } from "express";

export interface AuthUser {
    id: string;
    role: 'super-admin' | 'admin' | 'operator' | 'viewer';
    clientId?: string | null;
    email?: string;
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}