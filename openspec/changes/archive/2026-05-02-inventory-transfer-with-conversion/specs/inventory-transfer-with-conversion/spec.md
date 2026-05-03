## ADDED Requirements

### Requirement: Admin can transfer inventory between tenant SKUs with optional conversion
The system SHALL allow an admin to transfer stock from one SKU to another within the same tenant using `POST /api/inventory/transfer` with `{ fromSKU, toSKU, quantity, reason? }`.

#### Scenario: Successful transfer with conversion
- **WHEN** an admin requests a transfer where both products define a valid numeric conversion attribute and the calculated destination quantity is an exact integer
- **THEN** the system subtracts the origin quantity, adds the converted destination quantity, and returns success including both quantities

#### Scenario: Successful transfer without conversion
- **WHEN** an admin requests a transfer where one or both product types do not define `conversionAttribute`
- **THEN** the system applies a 1 to 1 transfer using the same quantity in origin and destination

#### Scenario: Transfer fails for invalid origin and destination pair
- **WHEN** an admin requests a transfer with `fromSKU` equal to `toSKU`
- **THEN** the system rejects the request with a validation error

#### Scenario: Transfer fails for insufficient stock
- **WHEN** an admin requests a transfer and the origin SKU stock is lower than the requested quantity
- **THEN** the system rejects the request with conflict error and no stock is changed

#### Scenario: Transfer fails for non-exact conversion
- **WHEN** an admin requests a transfer where the conversion formula produces a non-integer destination quantity
- **THEN** the system rejects the request with a validation error explaining the failed calculation

### Requirement: Transfers are fully audited with conversion metadata
The system SHALL persist an `InventoryTransfer` record for each transfer attempt including tenant, user, origin quantity, destination quantity, status, and whether a conversion was applied.

#### Scenario: Completed converted transfer is recorded
- **WHEN** a converted transfer operation completes successfully
- **THEN** the system stores an audit record with `quantityFrom`, `quantityTo`, `conversionApplied = true`, and completion metadata

#### Scenario: Completed 1 to 1 transfer is recorded
- **WHEN** a transfer operation completes without conversion
- **THEN** the system stores an audit record with `conversionApplied = false` and the same origin and destination quantities

#### Scenario: Failed transfer is recorded
- **WHEN** a transfer operation fails after creating an audit entry
- **THEN** the system stores or updates the audit record with status `failed` and failure context

### Requirement: Transfer history is queryable by admin and operator
The system SHALL expose `GET /api/inventory/transfers` with tenant scope and optional SKU filter, and SHALL return paginated results to admin and operator roles.

#### Scenario: Admin lists transfer history for tenant
- **WHEN** an admin requests transfer history without SKU filter
- **THEN** the system returns paginated tenant-scoped transfer records ordered by newest first

#### Scenario: Operator filters transfer history by SKU
- **WHEN** an operator requests transfer history with `sku` filter
- **THEN** the system returns records where the SKU appears as origin or destination

#### Scenario: Viewer requests transfer history
- **WHEN** a viewer requests `GET /api/inventory/transfers`
- **THEN** the system returns 403 Forbidden
