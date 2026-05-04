## Why

The current products feature is split between a frontend mock product list and a product settings UI that still lacks backend support. The project needs a tenant-aware product model that supports custom product types, tenant-specific attributes, unique SKU and EAN constraints, and a single CSV bulk import flow that is easier for operators to use than multiple files.

This change also introduces auditability and traceability for asynchronous imports so admins and operators can monitor file progress, inspect row-level errors, and review import history without losing visibility into what happened during processing.

## What Changes

- Add tenant-scoped product type management with a maximum of 10 custom attributes per type.
- **BREAKING** Update the product domain to support `productTypeId`, `productTypeVersion`, `ean`, and `customAttributes`.
- Add tenant-scoped uniqueness rules for SKU and EAN.
- Add asynchronous bulk import for a single CSV file that may contain products from multiple product types.
- Add import auditability through process, subprocess, and item-level error logs.
- Add automatic retry for one transient failure during import processing.
- Add import history and process visibility for `admin` and `operator` roles.
- Connect the existing frontend product settings feature to real backend APIs and prepare the UI for upload, progress, history, and toast notifications.

## Capabilities

### New Capabilities
- `product-type-management`: Tenant owners can define and maintain product types with versioned custom attributes.
- `bulk-product-import`: The system accepts one CSV file with mixed product types, validates each row against its type schema, and imports asynchronously.
- `import-process-tracking`: The system tracks import lifecycle, stages, retries, and item-level failures for audit and troubleshooting.

### Modified Capabilities
- `inventory-management`: Product storage and product CRUD now support tenant-scoped type metadata, custom attributes, and unique EAN values.

## Impact

- **Backend**: New models for product types and import tracking, updated product schema, new routes/controllers/services, CSV validation, and asynchronous process orchestration.
- **Frontend**: Existing product settings page must switch from in-memory mocks to API-backed data. New bulk import and history experiences are required.
- **Database**: New collections for product types, bulk processes, subprocesses, and item process logs. Product indexes must be updated.
- **Roles and Security**: `admin` can start imports and manage product types. `operator` can view import history and details. `viewer` remains read-only.
