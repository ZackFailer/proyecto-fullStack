# inventory-management Specification

## Purpose
TBD - created by archiving change product-types-with-bulk-import. Update Purpose after archive.
## Requirements
### Requirement: Products store product type metadata
The system SHALL store `productTypeId`, `productTypeVersion`, `customAttributes`, and optional `relatedProducts` for products created under the inventory model.

#### Scenario: Product is created with typed attributes
- **WHEN** an admin creates a product for a valid product type
- **THEN** the system stores the product type identifier, version, and custom attributes alongside fixed product fields

#### Scenario: Product stores related SKU references
- **WHEN** an admin creates or updates a product with `relatedProducts` entries that reference valid SKU from the same tenant
- **THEN** the system stores the related SKU metadata alongside the product record

#### Scenario: Product rejects invalid related SKU references
- **WHEN** an admin creates or updates a product with `relatedProducts` entries outside the tenant scope or with unknown SKU
- **THEN** the system rejects the request with a validation error

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

