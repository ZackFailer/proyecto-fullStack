## MODIFIED Requirements

### Requirement: Tenant-scoped product type definitions
The system SHALL allow an admin to create and maintain product types scoped to a single tenant, including an optional `conversionAttribute` that references one of the type's numeric attributes.

#### Scenario: Admin creates a product type
- **WHEN** an admin sends a valid request to create a product type for their tenant
- **THEN** the system stores the product type with tenant ownership and returns a success response

#### Scenario: Product type is isolated by tenant
- **WHEN** an admin requests product types
- **THEN** the system returns only product types belonging to the admin's tenant

#### Scenario: Admin sets a valid conversion attribute
- **WHEN** an admin creates or updates a product type with `conversionAttribute` pointing to an existing attribute of type `number`
- **THEN** the system stores the `conversionAttribute` and returns success

#### Scenario: Admin sets a missing conversion attribute
- **WHEN** an admin creates or updates a product type with `conversionAttribute` that does not match any defined attribute key
- **THEN** the system rejects the request with a validation error

#### Scenario: Admin sets a non-numeric conversion attribute
- **WHEN** an admin creates or updates a product type with `conversionAttribute` pointing to an attribute whose type is not `number`
- **THEN** the system rejects the request with a validation error
