# product-type-management Specification

## Purpose
TBD - created by archiving change product-types-with-bulk-import. Update Purpose after archive.
## Requirements
### Requirement: Tenant-scoped product type definitions
The system SHALL allow an admin to create and maintain product types scoped to a single tenant.

#### Scenario: Admin creates a product type
- **WHEN** an admin sends a valid request to create a product type for their tenant
- **THEN** the system stores the product type with tenant ownership and returns a success response

#### Scenario: Product type is isolated by tenant
- **WHEN** an admin requests product types
- **THEN** the system returns only product types belonging to the admin's tenant

### Requirement: Product type attributes are versioned and capped
The system SHALL limit each product type to a maximum of 10 custom attributes and SHALL preserve attribute version metadata.

#### Scenario: Admin adds the eleventh attribute
- **WHEN** an admin attempts to create or update a product type with more than 10 attributes
- **THEN** the system returns a validation error and does not persist the change

#### Scenario: Breaking attribute changes require version change
- **WHEN** an admin changes a published product type in a way that invalidates existing product rows
- **THEN** the system stores the updated definition as a new version

### Requirement: Product type permissions are enforced
The system SHALL allow only admin users to create or modify product types.

#### Scenario: Operator tries to create a product type
- **WHEN** an operator sends a create product type request
- **THEN** the system returns 403 Forbidden

#### Scenario: Viewer tries to update a product type
- **WHEN** a viewer sends an update request for a product type
- **THEN** the system returns 403 Forbidden

