## Context

The frontend already contains two early product-related experiences: a mock product list and a product settings UI that models custom attributes, guardrails, and CSV template generation. The backend, however, only supports a generic product schema with fixed fields and no tenant-aware product type definition. The desired product model is schema-driven per tenant, but bulk import must remain simple for the end user by accepting one CSV file that mixes product types.

This is a cross-cutting change affecting data modeling, validation, asynchronous processing, role permissions, import observability, and future inventory workflows. The design must support tenant isolation, versioned product types, row-level validation, process-level auditing, and frontend visibility into asynchronous job progress.

## Goals / Non-Goals

**Goals:**
- Add tenant-scoped product types with up to 10 custom attributes.
- Update products to store product type metadata, custom attributes, tenant-scoped SKU, and tenant-scoped EAN.
- Support one asynchronous CSV import containing products of different product types.
- Track import execution with process, subprocess, and item-level logging.
- Expose progress and history to `admin` and `operator` roles.
- Provide one automatic retry for transient import failures.
- Preserve the existing product settings direction and make it implementable end-to-end.

**Non-Goals:**
- Background processing distributed across external queue infrastructure.
- Email or push notifications for import completion.
- Automatic migration of legacy products into product type assignments.
- Full frontend implementation in this documentation step.
- Export workflows beyond error-file export for failed rows.

## Decisions

### 1. Use tenant-scoped product types with embedded attribute definitions
- Decision: Store attribute definitions inside a `ProductType` document, including version, active/deprecated flags, required status, and select options.
- Rationale: The existing frontend already models product types this way, and the import validator needs a single source of truth for row parsing.
- Alternative considered: Normalizing attributes into a separate collection. Rejected because reads become more complex while the attribute cap is small.

### 2. Keep product data partially structured and partially flexible
- Decision: Keep fixed product fields (`sku`, `ean`, `name`, `price`, `stock`, `category`) and add `productTypeId`, `productTypeVersion`, and `customAttributes`.
- Rationale: Core inventory queries stay indexable and stable, while type-specific attributes remain flexible.
- Alternative considered: Store all product fields dynamically. Rejected because core inventory operations need stable fields and indexes.

### 3. Process one CSV asynchronously with staged tracking
- Decision: Introduce `BulkProcess`, `BulkSubProcess`, and `ItemProcessLog` models and execute import work asynchronously after the upload request returns a process identifier.
- Rationale: Mixed-type files may be large and validation is non-trivial. Async execution improves UX and avoids request timeout risk.
- Alternative considered: Synchronous preview-and-confirm only. Rejected because it weakens operational visibility and does not scale well.

### 4. Track stages explicitly instead of only overall status
- Decision: Store subprocess records for `upload`, `parsing`, `validation`, `import`, and `finalization`.
- Rationale: Stage-level traceability makes failures diagnosable and gives the UI enough state to present meaningful progress.
- Alternative considered: Single process status with free-text details. Rejected because it loses structured audit data.

### 5. Log only item-level errors, not every success payload in detail
- Decision: `ItemProcessLog` focuses on rows with problems, while the process document stores aggregated counters for total, processed, successful, and failed rows.
- Rationale: This matches the stated need and keeps log storage manageable.
- Alternative considered: Persist one record per row regardless of outcome. Rejected because it increases storage and is unnecessary for the current audit goal.

### 6. Allow one automatic retry for transient failures
- Decision: Retry one time when the failure is transient, such as temporary DB or network issues during persistence.
- Rationale: Reduces manual recovery without masking persistent errors.
- Alternative considered: No retry or unlimited retry. No retry is less resilient; unlimited retry is harder to reason about operationally.

### 7. Restrict access by role based on operational responsibility
- Decision: `admin` can create and manage product types and start imports. `operator` can inspect history and process details but cannot start imports unless explicitly expanded later. `viewer` remains read-only.
- Rationale: Matches the project permission model while allowing operators to monitor imports.
- Alternative considered: Allow operators to import. Rejected because current scope did not request create permissions for this feature.

## Risks / Trade-offs

- [Risk] Product type versioning may complicate updates when types change after products already exist. → Mitigation: Store `productTypeVersion` on each product and treat breaking changes as version increments.
- [Risk] Dynamic attributes can reduce query simplicity for search and reporting. → Mitigation: Keep inventory-critical fields fixed and add targeted indexes later for selected attributes.
- [Risk] Async processing inside the backend app can be less durable than a dedicated worker system. → Mitigation: Model process state explicitly so a later queue migration is possible without redesigning contracts.
- [Risk] One mixed CSV can contain many invalid rows across multiple product types. → Mitigation: Validate by type, record row-specific errors, and provide downloadable error output.
- [Trade-off] Limiting types to 10 attributes simplifies UX and validation but reduces flexibility for edge cases. → Mitigation: Revisit only after real tenant usage shows the limit is too restrictive.

## Migration Plan

1. Add new models and update the product schema with tenant-aware indexes.
2. Introduce product type APIs and bulk import APIs without removing existing product endpoints.
3. Update product services and validation to require product type metadata for new writes.
4. Add process tracking models and async orchestration.
5. Connect frontend product settings to backend APIs.
6. Add bulk import UI with upload, history, polling, and toast notifications.
7. Backfill or manually reconcile legacy mock-driven product flows if needed.

## Open Questions

- Whether operators should eventually gain permission to start imports as a scoped create action.
- Whether failed-row reprocessing should accept corrected CSV uploads only or support reusing stored process payloads.
- Whether import progress will use polling first or later evolve to server-sent events or websockets.
