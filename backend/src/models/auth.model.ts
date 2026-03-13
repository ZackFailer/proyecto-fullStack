import { Request } from "express";

export interface AuthUser {
    id: string;
    role: 'super-admin' | 'admin' | 'operator' | 'viewer';
    clientId?: string | null;
    tenantId?: string | null;
    email?: string;
}

export interface TenantContext {
    tenantId: string;
    source: 'route' | 'header' | 'token';
}

export interface AuthRequest extends Request {
    user?: AuthUser;
    tenantContext?: TenantContext;
}