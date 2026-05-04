## MODIFIED Requirements

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
