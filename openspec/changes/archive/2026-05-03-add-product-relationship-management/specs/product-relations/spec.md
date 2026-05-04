## MODIFIED Requirements

### Requirement: Products support tenant-scoped related products
The system SHALL allow each product to store and update an optional list of related products as `{ sku, type }`, and each related SKU MUST belong to the same tenant as the source product when the relation is persisted.

#### Scenario: Admin saves related products with valid tenant SKUs
- **WHEN** an admin creates or updates a product including `relatedProducts` with existing SKUs from the same tenant
- **THEN** the system stores the related entries and returns success

#### Scenario: Admin saves related products with unknown or cross-tenant SKU through product API
- **WHEN** an admin sends a related SKU that does not exist in the tenant scope through the direct create or update product API
- **THEN** the system rejects the request with a validation error

#### Scenario: Admin updates related products from the product detail UI
- **WHEN** an admin edits the related products list from the product detail view and submits valid tenant-scoped relations
- **THEN** the system persists the full updated `relatedProducts` list for that source product

## ADDED Requirements

### Requirement: Bulk import can apply product relationships without failing the row
The system SHALL allow bulk import rows to include a `relatedProducts` field using unidirectional `SKU:type` entries, and SHALL omit invalid or unresolved relations without failing the product row.

#### Scenario: Imported row references existing tenant SKU
- **WHEN** a valid import row includes `relatedProducts` with a SKU that already exists in the tenant database
- **THEN** the imported product stores that relation with the requested type

#### Scenario: Imported row references SKU created earlier in the same file
- **WHEN** a valid import row includes `relatedProducts` with a SKU that was imported successfully earlier in the same process
- **THEN** the system resolves and stores that relation for the current product

#### Scenario: Imported row references unknown SKU
- **WHEN** a valid import row includes `relatedProducts` with a SKU that does not exist in the tenant and was not imported successfully in the same process
- **THEN** the system imports the product without that relation and records that the relation was omitted

### Requirement: Related products can be queried by SKU
The system SHALL expose a tenant-scoped endpoint to retrieve related products for a source SKU including `sku`, `name`, `stock`, and `type`, returning only currently resolvable relations.

#### Scenario: Admin fetches related products for a SKU
- **WHEN** an admin requests `GET /api/products/:sku/related` for a product that has related entries resolvable to products in the same tenant
- **THEN** the system returns the related products list with relation type and current stock

#### Scenario: Operator fetches related products for a SKU
- **WHEN** an operator requests `GET /api/products/:sku/related`
- **THEN** the system returns the same read-only related products response as admin

#### Scenario: Endpoint skips unresolved embedded relations
- **WHEN** a product contains embedded related entries whose target SKU no longer resolves to a product in the tenant
- **THEN** the endpoint excludes those unresolved entries from the response payload

#### Scenario: Viewer requests related products endpoint
- **WHEN** a viewer requests `GET /api/products/:sku/related`
- **THEN** the system returns 403 Forbidden
