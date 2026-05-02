## Context

The project is a MEAN stack admin dashboard with multi-tenant architecture. Previously, user management was incomplete—lacking proper CRUD operations, password management, role-based access control in the UI, and login attempt monitoring. This design covers the complete user management feature implementation across both backend and frontend layers.

## Goals / Non-Goals

**Goals:**
- Implement complete CRUD for users across global (superadmin) and tenant (admin) scopes
- Add privileged password change capability (admin/superadmin can change any user's password)
- Create password change request system for regular users
- Implement login attempt logging and retrieval for security monitoring
- Apply role-based access control (RBAC) in both API and UI
- Add proper route guards in frontend to protect sensitive pages
- Fix authentication redirect behavior based on user role

**Non-Goals:**
- UI for resolving password change requests (pending future feature)
- Additional test coverage beyond current backend tests
- User invitation system (future feature)
- Two-factor authentication (future feature)

## Decisions

### Backend Architecture

1. **User CRUD Layer Structure**
   - Decision: Use existing layered architecture (routers → controllers → services → models)
   - Rationale: Maintains consistency with existing codebase patterns
   - Alternative: Combined controller-service, rejected for separation of concerns

2. **Password Change Strategy**
   - Decision: Two endpoints - privileged change (admin/superadmin) and request-based change (users)
   - Rationale: Privileged change allows admins to help users without knowing their password; request-based provides security for regular users
   - Alternative: Single endpoint with role checks, rejected for clearer permission model

3. **Login Attempt Retrieval**
   - Decision: New dedicated endpoint `GET /api/login-attempts` with filters
   - Rationale: Separates security monitoring from user data, allows superadmin-only access
   - Alternative: Embed in user endpoint, rejected for role-based access complexity

4. **Role Validation in Middleware**
   - Decision: Add role checks in auth middleware, set `req.user` with typed payload
   - Rationale: Consistent with existing auth pattern, reusable across routes

### Frontend Architecture

1. **Route Guards Implementation**
   - Decision: Separate guards for tenant-admin (`tenant-admin.guard.ts`) and privileged routes (`tenant-privileged.guard.ts`)
   - Rationale: Granular control over different permission levels
   - Alternative: Single guard with config, rejected for flexibility

2. **User Table Actions by Role**
   - Decision: Show action column (Edit, Suspend/Reactivate) only for admin/operator roles
   - Rationale: viewer role should only read data, not modify
   - Alternative: Disable buttons for viewer, rejected for cleaner UI

3. **Password Change Modal Logic**
   - Decision: Show different options based on current user's role vs target user's role
   - Rationale: superadmin can change any password, admin can only change operator/viewer
   - Alternative: Single password change action, rejected for security requirements

4. **Login Attempts Page Structure**
   - Decision: New feature page under super-admin section with API service
   - Rationale: Proper feature organization, follows existing patterns
   - Alternative: Add to existing users page, rejected for separation of concerns

5. **Post-Login Redirect**
   - Decision: Route based on user role (superadmin → /admin/dashboard, tenant → /app/:clientId/dashboard)
   - Rationale: Clear separation between superadmin and tenant user experiences

## Risks / Trade-offs

- **Risk**: Password change request UI not implemented
  - **Mitigation**: Backend endpoints exist; document as pending for future implementation

- **Risk**: Role-based guards depend on correct role assignment in backend
  - **Mitigation**: Backend enforces role permissions; UI is secondary layer

- **Risk**: Login attempts page requires superadmin role
  - **Mitigation**: Guard protects route; API validates role as well

- **Risk**: Frontend tests not comprehensive for new components
  - **Mitigation**: Manual QA documented as pending; backend tests pass (104 tests)

- **Trade-off**: Added complexity in user modal with role-based conditional rendering
  - **Mitigation**: Necessary for proper security; keep conditional logic in adapter/service layer