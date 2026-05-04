# password-change-requests Specification

## Purpose
TBD - created by archiving change complete-user-management. Update Purpose after archive.
## Requirements
### Requirement: Password Change Request Creation
The system SHALL allow users to request a password change when they cannot remember their current password.

#### Scenario: User requests password change
- **WHEN** user sends POST to `/api/users/:id/password-change-requests` with reason
- **THEN** system creates password change request with status "pending" and returns success envelope

#### Scenario: User without credentials requests change
- **WHEN** unauthenticated user sends POST to public password request endpoint
- **THEN** system creates request linked to email address

### Requirement: Password Change Request Resolution
The system SHALL allow superadmins to approve or reject password change requests.

#### Scenario: Superadmin approves request
- **WHEN** superadmin sends POST to `/api/users/:id/password-change-requests/:reqId/resolve` with action "approve" and newPassword
- **THEN** system updates user password, marks request as "approved", and returns success envelope

#### Scenario: Superadmin rejects request
- **WHEN** superadmin sends POST to `/api/users/:id/password-change-requests/:reqId/resolve` with action "reject"
- **THEN** system marks request as "rejected" and returns success envelope

#### Scenario: Admin tries to resolve request
- **WHEN** admin sends POST to resolve request
- **THEN** system returns 403 Forbidden error

#### Scenario: User tries to resolve own request
- **WHEN** user sends POST to resolve their own request
- **THEN** system returns 403 Forbidden error

### Requirement: Pending Request Listing
The system SHALL allow superadmins to view all pending password change requests.

#### Scenario: Superadmin lists pending requests
- **WHEN** superadmin sends GET to `/api/users/password-change-requests?status=pending`
- **THEN** system returns list of all pending requests with user and requester details

