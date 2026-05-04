## 1. Backend Implementation (Backend API Agent)

### 1.1 User CRUD Operations
- [x] 1.1.1 Implement user model with role, tenantId, status fields
- [x] 1.1.2 Create user routes with CRUD endpoints
- [x] 1.1.3 Create user controller with business logic
- [x] 1.1.4 Create user service with tenant-scoped operations
- [x] 1.1.5 Add role-based middleware for user endpoints
- [x] 1.1.6 Implement user status (suspend/reactivate) endpoint

### 1.2 Privileged Password Change
- [x] 1.2.1 Add privileged password change endpoint
- [x] 1.2.2 Implement role validation (superadmin > admin > operator)
- [x] 1.2.3 Add password validation (8+ chars, mixed case, numbers)
- [x] 1.2.4 Create password-request model for tracking requests

### 1.3 Password Change Requests
- [x] 1.3.1 Create password change request endpoint
- [x] 1.3.2 Implement request resolution endpoint (approve/reject)
- [x] 1.3.3 Add superadmin-only access to request management

### 1.4 Login Attempt Monitoring
- [x] 1.4.1 Implement login attempt logging in auth service
- [x] 1.4.2 Create login-attempt model with timestamps, email, success
- [x] 1.4.3 Add login-attempt retrieval endpoint with filters
- [x] 1.4.4 Implement superadmin-only access to login attempts

### 1.5 Role-Based Access Control
- [x] 1.5.1 Add role validation in auth middleware
- [x] 1.5.2 Implement 403 responses for unauthorized actions
- [x] 1.5.3 Add tenant-scoped queries with proper validation

### 1.6 Testing
- [x] 1.6.1 Create user routes integration tests
- [x] 1.6.2 Create password change request routes tests
- [ ] 1.6.3 Create login-attempt routes integration tests
- [x] 1.6.4 Run all tests - 104 tests passing

---

## 2. Frontend Implementation (Frontend UI Agent)

### 2.1 Route Guards
- [x] 2.1.1 Create tenant-admin.guard.ts for user routes
- [x] 2.1.2 Create tenant-privileged.guard.ts for audit/history
- [x] 2.1.3 Apply guards in tenant-layout.routes.ts

### 2.2 Menu Filtering by Role
- [x] 2.2.1 Filter sidebar menu items based on user role
- [x] 2.2.2 Hide privileged options for viewer role
- [x] 2.2.3 Show Usuarios only for admin role

### 2.3 User Table
- [x] 2.3.1 Implement user table with role-based actions
- [x] 2.3.2 Add Edit button (admin role)
- [x] 2.3.3 Add Suspend/Reactivate buttons (admin role)
- [x] 2.3.4 Hide actions column for viewer role
- [x] 2.3.5 Create user API service

### 2.4 User Detail Modal
- [x] 2.4.1 Implement password change options by role
- [x] 2.4.2 Show "Cambiar contraseña" for superadmin (any user)
- [x] 2.4.3 Show "Cambiar contraseña" for admin (operator/viewer only)
- [x] 2.4.4 Show "Solicitar cambio al super-admin" for operator/viewer

### 2.5 Login Attempts Page
- [x] 2.5.1 Create login-attempts page at /admin/login-attempts
- [x] 2.5.2 Create login-attempts API service
- [x] 2.5.3 Implement filters: email, success, limit
- [x] 2.5.4 Add proper guards for superadmin-only access

### 2.6 Auth Fixes
- [x] 2.6.1 Implement role-based post-login redirects
- [x] 2.6.2 Fix refresh interceptor (401 only, not 403)
- [x] 2.6.3 Normalize tenant navigation to /app/:tenantId/...
- [x] 2.6.4 Apply role-based guard redirects

---

## 3. Pending (Not Implemented)

### 3.1 UI for Password Change Requests
- [ ] 3.1.1 Create page for superadmin to view pending requests
- [ ] 3.1.2 Add approve/reject buttons in UI
- [ ] 3.1.3 Connect to existing backend endpoint

### 3.2 Additional Testing
- [ ] 3.2.1 Login attempt routes test coverage
- [ ] 3.2.2 Frontend component tests for new features

### 3.3 Manual QA
- [ ] 3.3.1 Verify flows for each role (viewer/operator/admin/superadmin)
- [ ] 3.3.2 Verify guards redirect correctly
- [ ] 3.3.3 Test password change request flow end-to-end