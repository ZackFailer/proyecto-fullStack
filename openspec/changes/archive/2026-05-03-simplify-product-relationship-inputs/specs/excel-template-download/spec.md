## MODIFIED Requirements

### Requirement: Excel template download with dropdowns
The system SHALL generate an Excel (.xlsx) template file when a user requests to download a product type template, containing column headers, example values, and dropdown validation for select and boolean fields, plus the base import columns required by the bulk import contract.

#### Scenario: Admin downloads Excel template for product type with select field
- **WHEN** admin clicks "Download Template" for a product type that has a `select` field with options ["Rojo", "Azul", "Verde"]
- **THEN** system returns an .xlsx file with:
  - Column headers in row 1
  - Example values in row 2
  - Dropdown validation on the select column cell (rows 2-1000) with options "Rojo,Azul,Verde"

#### Scenario: Admin downloads Excel template for product type with boolean field
- **WHEN** admin clicks "Download Template" for a product type that has a `boolean` field
- **THEN** system returns an .xlsx file with dropdown validation on the boolean column containing "true,false"

#### Scenario: Admin downloads Excel template for product type with multiselect field
- **WHEN** admin clicks "Download Template" for a product type that has a `multiselect` field with options ["XS", "S", "M", "L", "XL"]
- **THEN** system returns an .xlsx file with:
  - A comment/note on the header cell indicating "Usa ; para separar múltiples valores. Ejemplo: XS;S"
  - Example value containing the separator (e.g., "XS;S")

#### Scenario: Admin requests CSV format
- **WHEN** admin adds query parameter `format=csv` to the download request
- **THEN** system returns a CSV file (same behavior as current)

#### Scenario: Template includes base product columns and related products
- **WHEN** admin downloads any template
- **THEN** the file SHALL contain columns: productTypeId, productTypeVersion, sku, ean, name, category, price, stock, relatedProducts, followed by dynamic attribute columns

### Requirement: Excel template is compatible with external tools
The generated Excel file SHALL be openable and editable in Excel, Google Sheets, and LibreOffice Calc without data loss, including the `relatedProducts` column example format based on comma-separated SKU values.

#### Scenario: Open template in Google Sheets
- **WHEN** user opens the .xlsx file in Google Sheets
- **THEN** all columns display correctly and dropdowns function for select/boolean fields

#### Scenario: Export to CSV from Excel
- **WHEN** user exports the filled Excel file to CSV and imports it
- **THEN** the imported data passes validation and creates/updates products correctly, including `relatedProducts` values encoded in a single CSV cell as comma-separated SKU values

## ADDED Requirements

### Requirement: Templates show simple related product examples
The system SHALL present `relatedProducts` examples and helper text using the simplified comma-separated SKU format without typed suffixes.

#### Scenario: User reviews example row
- **WHEN** a user opens a generated CSV or Excel template
- **THEN** the example value for `relatedProducts` uses a format like `SKU-002,SKU-003` instead of `SKU:type`
