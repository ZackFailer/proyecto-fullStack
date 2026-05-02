## ADDED Requirements

### Requirement: Import processes are tracked with structured statuses
The system SHALL track each import using a process record with aggregate counters and a lifecycle status.

#### Scenario: Process is created after upload
- **WHEN** a valid import upload request is accepted
- **THEN** the system creates a process record with pending or processing status and stores file metadata

#### Scenario: Process finishes with mixed results
- **WHEN** some rows import successfully and others fail validation or persistence
- **THEN** the system marks the process as partial and stores aggregate counts for successful and failed items

### Requirement: Import stages are tracked as subprocesses
The system SHALL track the stages upload, parsing, validation, import, and finalization as subprocess records.

#### Scenario: Validation stage fails
- **WHEN** a failure occurs during validation
- **THEN** the corresponding subprocess is marked failed and the process status reflects the failure outcome

#### Scenario: Finalization stage completes
- **WHEN** all process stages complete
- **THEN** the finalization subprocess is marked completed and the process completion timestamp is stored

### Requirement: Item-level errors are auditable
The system SHALL persist item-level error logs for rows that fail validation or import.

#### Scenario: Row fails because product type does not exist
- **WHEN** a row references a missing product type
- **THEN** the system stores an item log with the row number, original row data, and error details

#### Scenario: Row fails on retryable persistence error
- **WHEN** a row encounters a transient import failure and then fails again after one retry
- **THEN** the system stores the final item error with retry attempt metadata

### Requirement: Import history is visible to admin and operator
The system SHALL allow admin and operator roles to inspect import history, process details, and item-level errors.

#### Scenario: Operator requests process history
- **WHEN** an operator requests the import history list for their tenant
- **THEN** the system returns tenant-scoped process summaries

#### Scenario: Viewer requests process details
- **WHEN** a viewer requests import process details
- **THEN** the system returns 403 Forbidden
