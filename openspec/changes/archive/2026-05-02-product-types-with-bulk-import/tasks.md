## 1. Backend Domain Modeling

- [x] 1.1 Create `product-type.model.ts` with tenant ownership, versioning, attribute metadata, and max 10 attributes validation
- [x] 1.2 Update `product.model.ts` to add `tenantId`, `productTypeId`, `productTypeVersion`, `ean`, and `customAttributes`
- [x] 1.3 Add tenant-scoped unique indexes for SKU and EAN and supporting query indexes for product types
- [x] 1.4 Add typed DTOs or domain types for product types, custom attributes, and bulk process entities

## 2. Backend Product Type APIs

- [x] 2.1 Create `product-type.service.ts` for list, create, update, and deactivate flows
- [x] 2.2 Create `product-type.controller.ts` with input validation and standard response envelopes
- [x] 2.3 Create `product-type.routes.ts` with admin-only create and update access
- [x] 2.4 Register product type routes in the backend router tree
- [x] 2.5 Enforce tenant isolation and role permissions for all product type operations

## 3. Backend Bulk Import Tracking

- [x] 3.1 Create `bulk-process.model.ts` for process-level audit and counters
- [x] 3.2 Create `bulk-subprocess.model.ts` for stage-level tracking
- [x] 3.3 Create `item-process-log.model.ts` for row-level error logs
- [x] 3.4 Create services to create, update, and query process tracking records
- [x] 3.5 Add indexes for tenant history and process error retrieval

## 4. Backend Bulk Import Execution

- [x] 4.1 Add bulk import endpoints to start a process and fetch process history or details
- [x] 4.2 Implement CSV parsing service for one file with mixed product types
- [x] 4.3 Implement row validation against fixed fields and product type attribute schemas
- [x] 4.4 Implement one automatic retry for transient persistence failures
- [x] 4.5 Persist successful rows as products and persist item-level errors for invalid rows
- [x] 4.6 Track subprocess progression for upload, parsing, validation, import, and finalization
- [x] 4.7 Restrict import creation to admin and allow history/detail access to admin and operator
- [x] 4.8 Provide downloadable error output or error list endpoint for failed rows

## 5. Backend Inventory Updates

- [x] 5.1 Update product service create and update flows to require valid product type metadata
- [x] 5.2 Validate tenant-scoped uniqueness for SKU and EAN in manual and imported product writes
- [x] 5.3 Update product controller responses to include product type metadata and custom attributes
- [x] 5.4 Update product listing filters to support `productTypeId` and future import history links

## 6. Backend Tests

- [x] 6.1 Add integration tests for product type CRUD and role restrictions
- [x] 6.2 Add integration tests for tenant-scoped SKU and EAN uniqueness
- [x] 6.3 Add integration tests for asynchronous bulk import lifecycle and process status transitions
- [x] 6.4 Add integration tests for operator access to history and forbidden viewer access
- [x] 6.5 Add validation tests for mixed-type CSV imports and row-level error logging

## 7. Frontend Product Type Integration

- [x] 7.1 Replace in-memory `ProductSettingsData` storage with API-backed product type data
- [x] 7.2 Add frontend API and data services for product type CRUD
- [x] 7.3 Keep the existing product settings UX while wiring create, list, and selection flows to backend data
- [x] 7.4 Reflect admin-only actions in the product settings UI

## 8. Frontend Bulk Import UX

- [x] 8.1 Create a bulk import page for CSV upload under tenant products
- [x] 8.2 Add API and data services to start imports and poll process status
- [x] 8.3 Add progress UI based on process and subprocess data
- [x] 8.4 Add import history UI visible for admin and operator only
- [x] 8.5 Add item error review UI and download trigger for failed rows
- [x] 8.6 Add toast notifications for started, completed, partial, and failed imports

## 9. Frontend Tests and Verification

- [x] 9.1 Add tests for product type permissions and import history visibility
- [x] 9.2 Add tests for bulk import polling, toast notifications, and error states
- [x] 9.3 Run backend tests and relevant frontend verification after implementation
