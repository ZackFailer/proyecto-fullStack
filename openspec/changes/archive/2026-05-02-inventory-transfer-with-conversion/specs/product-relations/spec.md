## ADDED Requirements

### Requirement: Products support tenant-scoped related products
The system SHALL allow each product to store an optional list of related products as `{ sku, type }`, and each related SKU MUST belong to the same tenant as the source product.

#### Scenario: Admin saves related products with valid tenant SKUs
- **WHEN** an admin creates or updates a product including `relatedProducts` with existing SKUs from the same tenant
- **THEN** the system stores the related entries and returns success

#### Scenario: Admin saves related products with unknown or cross-tenant SKU
- **WHEN** an admin sends a related SKU that does not exist in the tenant scope
- **THEN** the system rejects the request with a validation error

### Requirement: Related products can be queried by SKU
The system SHALL expose a tenant-scoped endpoint to retrieve related products for a source SKU including `sku`, `name`, `stock`, and `type`.

#### Scenario: Admin fetches related products for a SKU
- **WHEN** an admin requests `GET /api/products/:sku/related` for a product that has related entries
- **THEN** the system returns the related products list with relation type and current stock

#### Scenario: Operator fetches related products for a SKU
- **WHEN** an operator requests `GET /api/products/:sku/related`
- **THEN** the system returns the same read-only related products response as admin

#### Scenario: Viewer requests related products endpoint
- **WHEN** a viewer requests `GET /api/products/:sku/related`
- **THEN** the system returns 403 Forbidden
