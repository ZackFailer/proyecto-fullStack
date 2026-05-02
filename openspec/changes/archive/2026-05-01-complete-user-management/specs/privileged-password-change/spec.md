## ADDED Requirements

### Requirement: Privileged Password Change
The system SHALL allow admins and superadmins to change any user's password without knowing the current password.

#### Scenario: Superadmin changes any user's password
- **WHEN** superadmin sends POST to `/api/users/:id/privileged-password` with newPassword
- **THEN** system updates user's passwordHash and returns success envelope

#### Scenario: Admin changes operator's password
- **WHEN** admin sends POST to `/api/users/:id/privileged-password` for operator in their tenant
- **THEN** system updates the password and returns success envelope

#### Scenario: Admin tries to change superadmin's password
- **WHEN** admin sends POST to `/api/users/:id/privileged-password` for superadmin
- **THEN** system returns 403 Forbidden error

#### Scenario: Operator tries to use privileged password change
- **WHEN** operator sends POST to `/api/users/:id/privileged-password`
- **THEN** system returns 403 Forbidden error

### Requirement: Password Change Validation
The system SHALL validate new passwords meet security requirements before allowing privileged changes.

#### Scenario: Admin sets weak password
- **WHEN** admin sends POST with password "123"
- **THEN** system returns 400 Bad Request with validation error

#### Scenario: Admin sets valid password
- **WHEN** admin sends POST with password meeting requirements (8+ chars, mixed case, numbers)
- **THEN** system accepts password and returns success envelope