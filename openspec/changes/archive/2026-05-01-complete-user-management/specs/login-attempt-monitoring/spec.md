## ADDED Requirements

### Requirement: Login Attempt Logging
The system SHALL automatically log all authentication attempts (success and failure) for security monitoring.

#### Scenario: User logs in successfully
- **WHEN** user sends POST to `/api/auth/login` with valid credentials
- **THEN** system creates login attempt record with success=true and stores it

#### Scenario: User fails login
- **WHEN** user sends POST to `/api/auth/login` with invalid credentials
- **THEN** system creates login attempt record with success=false and stores it

### Requirement: Login Attempt Retrieval
The system SHALL allow superadmins to query and filter login attempts.

#### Scenario: Superadmin lists recent login attempts
- **WHEN** superadmin sends GET to `/api/login-attempts`
- **THEN** system returns paginated list of login attempts sorted by timestamp descending

#### Scenario: Superadmin filters by email
- **WHEN** superadmin sends GET to `/api/login-attempts?email=user@example.com`
- **THEN** system returns only login attempts for that email

#### Scenario: Superadmin filters by success status
- **WHEN** superadmin sends GET to `/api/login-attempts?success=false`
- **THEN** system returns only failed login attempts

#### Scenario: Superadmin limits results
- **WHEN** superadmin sends GET to `/api/login-attempts?limit=50`
- **THEN** system returns maximum 50 login attempts

#### Scenario: Admin tries to access login attempts
- **WHEN** admin (non-superadmin) sends GET to `/api/login-attempts`
- **THEN** system returns 403 Forbidden error

#### Scenario: Viewer tries to access login attempts
- **WHEN** viewer sends GET to `/api/login-attempts`
- **THEN** system returns 403 Forbidden error