## Why

The user management feature was incomplete and lacked proper role-based access control (RBAC). The system needed a complete CRUD for users across tenants, privileged password management capabilities, and a comprehensive login attempt monitoring system to enhance security and auditability. This change addresses these gaps by implementing a full user management system with proper role enforcement at both backend and frontend levels.

## What Changes

### Backend
- CRUD operations for users (global and tenant-scoped)
- Privileged password change endpoint (admin/superadmin can change any user's password)
- Password change request system (users can request password changes)
- Login attempt logging and retrieval endpoint (`GET /api/login-attempts`)
- Role-based middleware to enforce permissions

### Frontend
- New guards: `tenant-admin.guard.ts` (protects user routes for admin/superadmin), `tenant-privileged.guard.ts` (protects audit/history for admin/operator)
- Route protection applied in `tenant-layout.routes.ts`
- User table with role-based action column (Edit, Suspend/Reactivate)
- User detail modal with password change options by role
- Login attempts page at `/admin/login-attempts` with filters (email, success, limit)
- Login attempts page with filters: email, success (true/false), limit
- Auth fixes: role-based post-login redirects, refresh interceptor fixes, tenant navigation normalization

### Security & Roles
- Menu filtered by role (viewer sees less, admin sees more)
- API endpoints enforce role permissions (403 for unauthorized actions)
- UI actions hidden/disabled based on user role
- Password change modal: superadmin can change any, admin can change operator/viewer, users can request change to superadmin

## Capabilities

### New Capabilities
- `user-management`: Complete user CRUD with role-based access control
- `privileged-password-change`: Admin/superadmin can change passwords without knowing current password
- `password-change-requests`: Users can request password changes to superadmin
- `login-attempt-monitoring`: Superadmin can view and filter login attempts

### Modified Capabilities
- `authentication`: Added role-based post-login redirects and refresh token improvements
- `multi-tenant-access`: Added tenant context guards for protected routes

## Impact

- **Backend**: New routes, controllers, services for user management and login attempts
- **Frontend**: New pages, components, guards, and services for user management UI
- **Security**: Enhanced with login attempt logging and stricter role enforcement
- **Dependencies**: No new external dependencies added