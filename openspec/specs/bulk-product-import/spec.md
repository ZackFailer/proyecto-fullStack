# bulk-product-import Specification

## Purpose
TBD - created by archiving change product-types-with-bulk-import. Update Purpose after archive.
## Requirements
### Requirement: Single CSV import for mixed product types
The system SHALL accept a single CSV file that contains products from multiple product types for the same tenant.

#### Scenario: CSV contains multiple valid product types
- **WHEN** an admin uploads a CSV file with rows for different valid product types in the same tenant
- **THEN** the system creates an asynchronous import process and validates each row against the corresponding product type

### Requirement: Row validation uses product type schema
The system SHALL validate each row against the fixed product fields and the custom attribute schema of the referenced product type.

#### Scenario: Required custom field is missing
- **WHEN** a row omits a required custom attribute for its product type
- **THEN** the system records an item-level validation error for that row

#### Scenario: Select option is invalid
- **WHEN** a row includes a value outside the configured options for a select attribute
- **THEN** the system records an item-level validation error for that row

### Requirement: SKU and EAN are unique per tenant
The system SHALL enforce tenant-scoped uniqueness for both SKU and EAN during manual creation and bulk import.

#### Scenario: Duplicate SKU exists in tenant
- **WHEN** a row contains a SKU already used by another product in the same tenant
- **THEN** the system records an item-level error and does not import that row

#### Scenario: Duplicate EAN exists in tenant
- **WHEN** a row contains an EAN already used by another product in the same tenant
- **THEN** the system records an item-level error and does not import that row

### Requirement: Import runs asynchronously
The system SHALL return a process identifier immediately after upload and continue parsing, validation, and import asynchronously.

#### Scenario: Import starts successfully
- **WHEN** an admin uploads a supported CSV file
- **THEN** the API returns a success response with a process identifier before row import completes

### Requirement: Bulk import accepts related product references
The system SHALL accept a `relatedProducts` column in CSV and template-driven imports, where each cell can contain one or more related SKU values separated by commas.

#### Scenario: Row contains one related product
- **WHEN** an admin uploads a valid row with `relatedProducts` set to `SKU-002`
- **THEN** the import parser maps that cell to a single related product candidate for the source row with default relation type `related`

#### Scenario: Row contains multiple related products
- **WHEN** an admin uploads a valid row with `relatedProducts` set to `"SKU-002,SKU-003"`
- **THEN** the parser preserves the full cell content and maps it to multiple related product candidates for the source row with default relation type `related`

### Requirement: Bulk import preserves product creation when relations cannot be applied
The system SHALL continue importing a valid product row even when one or more related product references are malformed, duplicated, self-referential, use deprecated typed syntax, or cannot be resolved.

#### Scenario: Relation entry has invalid format
- **WHEN** a row contains an empty or malformed SKU entry in `relatedProducts`
- **THEN** the product row is still imported and the invalid relation entry is omitted from persistence

#### Scenario: Relation entry uses deprecated typed syntax
- **WHEN** a row contains a `relatedProducts` entry using the deprecated `SKU:type` structure
- **THEN** the product row is still imported and that typed relation entry is omitted from persistence with a warning

#### Scenario: Relation points to same SKU
- **WHEN** a row contains a `relatedProducts` entry that references the same SKU as the source product
- **THEN** the product row is still imported and the self-reference is omitted

#### Scenario: Relation duplicates another relation in the same cell
- **WHEN** a row contains duplicate related SKU entries in `relatedProducts`
- **THEN** the product row is still imported and duplicate relation entries are omitted from persistence

### Requirement: Bulk import records omitted relations for operator review
The system SHALL keep item-level traceability for related product entries that were omitted during import, without counting the row as a failed import.

#### Scenario: Product imports with omitted relations
- **WHEN** a row imports successfully but one related SKU could not be resolved
- **THEN** the process stores item-level details indicating which relation entries were omitted while keeping the row status as successful

