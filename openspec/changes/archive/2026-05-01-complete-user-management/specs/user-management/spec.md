## ADDED Requirements

### Requirement: User CRUD Operations
The system SHALL provide complete CRUD operations for user management across both global (superadmin) and tenant (admin) scopes.

#### Scenario: Superadmin creates global user
- **WHEN** superadmin sends POST to `/api/users` with user data
- **THEN** system creates user with role and returns success envelope

#### Scenario: Admin creates tenant user
- **WHEN** admin sends POST to `/api/users` with tenantId in body
- **THEN** system creates user scoped to tenant and returns success envelope

#### Scenario: Admin lists tenant users
- **WHEN** admin sends GET to `/api/users` with tenantId filter
- **THEN** system returns only users belonging to that tenant

#### Scenario: Admin updates tenant user
- **WHEN** admin sends PUT to `/api/users/:id` for user in their tenant
- **THEN** system updates user data and returns success envelope

#### Scenario: Admin deletes tenant user
- **WHEN** admin sends DELETE to `/api/users/:id` for user in their tenant
- **THEN** system marks user as deleted and returns success envelope

### Requirement: Role-Based User Listing
The system SHALL filter user listings based on the requester's role to prevent unauthorized access.

#### Scenario: Viewer lists users
- **WHEN** viewer sends GET to `/api/users`
- **THEN** system returns users with sensitive fields (passwordHash) excluded

#### Scenario: Admin tries to access other tenant users
- **WHEN** admin sends GET to `/api/users` with different tenantId
- **THEN** system returns 403 Forbidden error

#### Scenario: Viewer tries to create user
- **WHEN** viewer sends POST to `/api/users`
- **THEN** system returns 403 Forbidden error

### Requirement: User Status Management
The system SHALL allow admins to suspend and reactivate user accounts.

#### Scenario: Admin suspends user
- **WHEN** admin sends PATCH to `/api/users/:id/status` with action "suspend"
- **THEN** system marks user as suspended and returns success envelope

#### Scenario: Admin reactivates user
- **WHEN** admin sends PATCH to `/api/users/:id/status` with action "reactivate"
- **THEN** system marks user as active and returns success envelope