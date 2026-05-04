## ADDED Requirements

### Requirement: Products store product type metadata
The system SHALL store `productTypeId`, `productTypeVersion`, and `customAttributes` for products created under the new inventory model.

#### Scenario: Product is created with typed attributes
- **WHEN** an admin creates a product for a valid product type
- **THEN** the system stores the product type identifier, version, and custom attributes alongside fixed product fields

### Requirement: Products support tenant-scoped EAN
The system SHALL support an optional EAN field that is unique within a tenant.

#### Scenario: Product is created with unique EAN
- **WHEN** an admin creates a product with an unused EAN in the tenant
- **THEN** the system stores the EAN and returns success

#### Scenario: Product is created with duplicate EAN in tenant
- **WHEN** an admin creates a product with an EAN already used in the same tenant
- **THEN** the system returns a validation error

### Requirement: Existing inventory flows remain tenant-aware
The system SHALL preserve tenant scoping for list, create, update, and import operations.

#### Scenario: Admin lists products
- **WHEN** an admin requests products for their tenant
- **THEN** the system returns only products belonging to that tenant
