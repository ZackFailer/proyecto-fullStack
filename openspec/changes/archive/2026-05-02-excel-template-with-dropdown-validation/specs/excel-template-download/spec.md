## ADDED Requirements

### Requirement: Excel template download with dropdowns
The system SHALL generate an Excel (.xlsx) template file when a user requests to download a product type template, containing column headers, example values, and dropdown validation for select and boolean fields.

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

#### Scenario: Template includes base product columns
- **WHEN** admin downloads any template
- **THEN** the file SHALL contain columns: productTypeId, productTypeVersion, sku, name, category, price, stock, followed by dynamic attribute columns

### Requirement: Excel template is compatible with external tools
The generated Excel file SHALL be openable and editable in Excel, Google Sheets, and LibreOffice Calc without data loss.

#### Scenario: Open template in Google Sheets
- **WHEN** user opens the .xlsx file in Google Sheets
- **THEN** all columns display correctly and dropdowns function for select/boolean fields

#### Scenario: Export to CSV from Excel
- **WHEN** user exports the filled Excel file to CSV and imports it
- **THEN** the imported data passes validation and creates/updates products correctly