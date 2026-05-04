## 1. Backend Product Model

- [x] 1.1 Add optional `relatedProducts` field to `backend/src/models/product.model.ts` with shape `{ sku, type }`
- [x] 1.2 Enforce relation type enum `derived-from | component-of | variant-of | related` with default `related`
- [x] 1.3 Add index for `relatedProducts.sku` and keep tenant-scoped query compatibility
- [x] 1.4 Update create/update validation flow to reject related SKUs outside tenant scope (basic validation exists - extendable)

## 2. Backend Transfer Audit Model

- [x] 2.1 Create `backend/src/models/inventory-transfer.model.ts` with transfer fields and status lifecycle
- [x] 2.2 Add indexes for history queries (`tenantId + createdAt`, `fromSKU`, `toSKU`) and pending-cleanup queries
- [x] 2.3 Export typed interfaces for service/controller consumption

## 3. Backend Transfer Service

- [x] 3.1 Create `backend/src/services/inventory-transfer.service.ts` with typed transfer DTO and result DTO
- [x] 3.2 Validate request rules (`fromSKU !== toSKU`, positive integer quantity, tenant scope)
- [x] 3.3 Implement atomic stock movement using MongoDB transaction/session
- [x] 3.4 Persist `InventoryTransfer` as `pending` before execution and finalize as `completed` or `failed`
- [x] 3.5 Add query method for paginated transfer history with optional SKU filter
- [x] 3.6 Add on-demand cleanup for stale `pending` transfers older than timeout threshold

## 4. Backend APIs and Authorization

- [x] 4.1 Add `POST /api/inventory/transfer` endpoint guarded for `admin`
- [x] 4.2 Add `GET /api/inventory/transfers` endpoint guarded for `admin` and `operator`
- [x] 4.3 Add `GET /api/products/:sku/related` endpoint guarded for `admin` and `operator`
- [x] 4.4 Ensure responses follow standard envelope and error middleware conventions

## 5. Frontend Transfer Experience

- [x] 5.1 Add transfer button in product detail page visible only for `admin`
- [x] 5.2 Build transfer modal with destination SKU selector, quantity input, and optional reason
- [x] 5.3 Wire modal submit to transfer API service with loading/error/success states
- [x] 5.4 Refresh product data after successful transfer and show confirmation toast

## 6. Frontend Related Products Experience

- [x] 6.1 Add related-products section in product detail page for users with read permission
- [x] 6.2 Render related SKU, product name, relation type, and current stock
- [x] 6.3 Add navigation action from related item to related product detail

## 7. Frontend Navigation & Components

- [x] 7.1 Move product-detail component to `frontend/src/app/features/tenant/products/pages/`
- [x] 7.2 Update tenant-layout.routes.ts to load from products/pages
- [x] 7.3 Add onRowSelect event to SingleTable component
- [x] 7.4 Add viewProduct navigation in product-list to navigate to /tenant/products/:sku

## 8. Testing and Verification

- [x] 8.1 Add backend integration test for successful transfer and stock balance updates
- [x] 8.2 Add backend integration tests for insufficient stock, same SKU, and missing SKU errors
- [x] 8.3 Add backend authorization tests for transfer/history/related endpoints by role
- [x] 8.4 Add backend test for transfer history pagination and SKU filtering behavior
- [x] 8.5 Add frontend tests for transfer modal role visibility and successful submit flow
- [x] 8.6 Add frontend tests for related products rendering and navigation

## 9. Frontend Data Freshness (post-launch fix)

- [x] 9.1 Fix ProductData singleton issue - data not refreshing on navigation
- [x] 9.2 Remove loadProducts() call from ProductData constructor, add to ProductList constructor
- [x] 9.3 Remove loadProducts() call from ProductDetailData, add to ProductDetail component constructor
- [x] 9.4 Update copilot-instructions.md with rule: NO singletons for data services