## ADDED Requirements

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
