## ADDED Requirements

### Requirement: Bulk import accepts related product references
The system SHALL accept a `relatedProducts` column in CSV and template-driven imports, where each cell can contain one or more unidirectional relations encoded as `SKU:type` entries.

#### Scenario: Row contains one related product
- **WHEN** an admin uploads a valid row with `relatedProducts` set to `SKU-002:variant-of`
- **THEN** the import parser maps that cell to a single related product candidate for the source row

#### Scenario: Row contains multiple related products
- **WHEN** an admin uploads a valid row with `relatedProducts` set to `"SKU-002:variant-of,SKU-003:component-of"`
- **THEN** the parser preserves the full cell content and maps it to multiple related product candidates for the source row

### Requirement: Bulk import preserves product creation when relations cannot be applied
The system SHALL continue importing a valid product row even when one or more related product references are malformed, duplicated, self-referential, or unresolved.

#### Scenario: Relation entry has invalid format
- **WHEN** a row contains a `relatedProducts` entry without a valid `SKU:type` structure
- **THEN** the product row is still imported and the invalid relation entry is omitted from persistence

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
