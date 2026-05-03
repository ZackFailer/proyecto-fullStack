## ADDED Requirements

### Requirement: Admin can transfer inventory between tenant SKUs
The system SHALL allow an admin to transfer stock from one SKU to another within the same tenant using `POST /api/inventory/transfer` with `{ fromSKU, toSKU, quantity, reason? }`.

#### Scenario: Successful transfer with valid stock
- **WHEN** an admin requests a transfer where `fromSKU` and `toSKU` exist and `fromSKU` has stock greater than or equal to `quantity`
- **THEN** the system atomically subtracts stock from `fromSKU`, adds stock to `toSKU`, and returns success

#### Scenario: Transfer fails for insufficient stock
- **WHEN** an admin requests a transfer and `fromSKU` stock is lower than `quantity`
- **THEN** the system rejects the request with conflict error and no stock is changed

#### Scenario: Transfer fails for invalid origin and destination pair
- **WHEN** an admin requests a transfer with `fromSKU` equal to `toSKU`
- **THEN** the system rejects the request with a validation error

### Requirement: Transfers are fully audited with status
The system SHALL persist an `InventoryTransfer` record for each transfer attempt including tenant, user, SKUs, quantity, reason, and execution status.

#### Scenario: Completed transfer is recorded
- **WHEN** a transfer operation completes successfully
- **THEN** the system stores an audit record with status `completed` and completion timestamp

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
