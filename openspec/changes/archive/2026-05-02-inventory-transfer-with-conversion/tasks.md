## 1. Backend Product Type Conversion Support

- [x] 1.1 Add optional `conversionAttribute` to the `ProductType` model and exported types
- [x] 1.2 Validate on create/update that `conversionAttribute` references an existing numeric attribute key
- [x] 1.3 Return a validation error when `conversionAttribute` references a missing attribute
- [x] 1.4 Return a validation error when `conversionAttribute` references a non-numeric attribute

## 2. Backend Product Relations Support

- [x] 2.1 Add optional `relatedProducts` to the `Product` model with `{ sku, type }` entries
- [x] 2.2 Enforce the relation type enum `derived-from | component-of | variant-of | related` with default `related`
- [x] 2.3 Add an index for `relatedProducts.sku` while preserving tenant-scoped queries
- [x] 2.4 Update product create/update validation to reject unknown or cross-tenant related SKU references

## 3. Backend Transfer Audit Model

- [x] 3.1 Create or extend `inventory-transfer.model.ts` to store `quantityFrom`, `quantityTo`, `conversionApplied`, status, tenant, user, and timestamps
- [x] 3.2 Persist optional conversion details needed to explain the result in history responses
- [x] 3.3 Add indexes for tenant history queries, SKU filters, and stale pending cleanup

## 4. Backend Transfer Service and APIs

- [x] 4.1 Update the transfer service to load origin/destination products and their product types within tenant scope
- [x] 4.2 Apply conversion when both product types define valid conversion attributes and fall back to 1:1 otherwise
- [x] 4.3 Reject transfers when the computed destination quantity is not an exact integer
- [x] 4.4 Keep the transfer atomic with pending -> completed/failed audit lifecycle
- [x] 4.5 Return transfer responses with origin quantity, destination quantity, and conversion metadata
- [x] 4.6 Expose `POST /api/inventory/transfer` for `admin` and preserve `GET /api/inventory/transfers` access for `admin` and `operator`
- [x] 4.7 Expose `GET /api/products/:sku/related` for `admin` and `operator` with tenant-scoped related product data

## 5. Backend Cleanup and Validation Coverage

- [x] 5.1 Add or update pending-transfer cleanup to mark expired `pending` records as `failed`
- [x] 5.2 Add integration tests for converted transfers, 1:1 fallback transfers, and non-exact conversion rejection
- [x] 5.3 Add integration tests for insufficient stock, same SKU, missing SKU, and role authorization errors
- [x] 5.4 Add tests for `conversionAttribute` validation and transfer history filtering/pagination

## 6. Frontend Transfer Experience

- [x] 6.1 Update the transfer modal to show source context, destination selector, quantity, optional reason, and action buttons consistently
- [x] 6.2 Add a transfer preview that displays whether conversion applies, the factors used, and the resulting destination quantity
- [x] 6.3 Submit transfers through the inventory API and refresh product detail state after success
- [x] 6.4 Show success and error feedback that includes both origin and destination quantities when applicable

## 7. Frontend Product Detail Experience

- [x] 7.1 Keep the product detail page as the operational view for a SKU with labeled summary sections
- [x] 7.2 Render `customAttributes` in a readable labeled section with empty state handling
- [x] 7.3 Render related products with SKU, name, relation type, stock, and navigation to related detail
- [x] 7.4 Ensure detail navigation between related SKU reloads the page data without route mismatch errors

## 8. Frontend Verification

- [x] 8.1 Add frontend tests for transfer button visibility by role and modal action availability
- [x] 8.2 Add frontend tests for conversion preview and successful transfer flow
- [x] 8.3 Add frontend tests for related products rendering and navigation between SKU detail pages
