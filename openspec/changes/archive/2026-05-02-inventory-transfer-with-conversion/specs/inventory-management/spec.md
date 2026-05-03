## MODIFIED Requirements

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
