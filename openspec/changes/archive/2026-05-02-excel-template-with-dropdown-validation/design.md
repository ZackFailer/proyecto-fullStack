## Context

El template CSV se genera actualmente en el frontend con JavaScript puro. Para añadir dropdowns necesitamos formato Excel, que no puede generarse solo con concatenación de strings. Se requiere una librería de generación de Excel en el backend que permita añadir reglas de validación de datos.

El proceso de importación **no cambia**: el backend solo valida el CSV final. El template Excel sirve exclusivamente para ayudar al usuario a llenar los datos correctamente.

## Goals / Non-Goals

**Goals:**
- Generar un archivo `.xlsx` con cabeceras, fila de ejemplo y dropdowns para campos `select` y `boolean`.
- El archivo debe ser editable en Excel, Google Sheets y LibreOffice Calc.
- El usuario debe poder guardar el archivo como CSV e importarlo sin errores de validación.
- La generación debe ser rápida y no impactar el rendimiento del backend.
- Mantener también la opción de descarga CSV para usuarios avanzados o automatizaciones.

**Non-Goals:**
- Soportar dropdowns para `multiselect` (requiere componentes ActiveX/VBA, lo que rompe compatibilidad con Google Sheets y es complejo). En su lugar se usará un comentario en la celda.
- Añadir validación de formato de número o fecha mediante Excel (Excel ya ofrece formato de celdas; el usuario puede formatear si quiere).
- Modificar el proceso de importación.
- Cambiar la política de unicidad o validación backend.

## Decisions

### 1. Formato Excel (.xlsx) como opción principal
- **Decisión**: El endpoint de template devolverá por defecto un archivo `.xlsx`. Se conservará la opción de CSV mediante un query parameter `format=csv`.
- **Razón**: Mejor experiencia para la mayoría de usuarios sin romper compatibilidad.
- **Alternativa considerada**: Solo Excel. Rechazada porque los flujos automatizados pueden necesitar CSV puro.

### 2. Librería `exceljs` en backend
- **Decisión**: Usar `exceljs` para generar el archivo. Soporta data validation (listas), comentarios y estilos.
- **Razón**: Madura, bien documentada, soporta streaming si fuera necesario, y es ampliamente usada.
- **Alternativa**: `xlsx` (SheetJS). También válida, pero `exceljs` tiene API más clara para añadir validación.

### 3. Estructura del archivo Excel
- **Decisión**:
  - **Hoja única** llamada "Template".
  - **Fila 1**: Cabeceras con formato negrita y fondo gris claro.
  - **Fila 2**: Valores de ejemplo (idénticos a los que generaría el CSV actual, pero con dropdowns donde aplique).
  - **Ancho de columna**: Auto-ajustado.
  - **Validación de datos**:
    - Para columnas `select`: dropdown con la lista de `options`.
    - Para columnas `boolean`: dropdown con `true, false`.
    - Para columnas `multiselect`: **sin dropdown**; se agrega un comentario en la celda de cabecera indicando "Usa ; para separar múltiples valores".
- **Razón**: Excel solo permite selección única en dropdowns nativos. Multiselect requeriría programación VBA o controles ActiveX que no son portables.

### 4. Generación en backend, no en frontend
- **Decisión**: La generación se hace en el backend, dentro del servicio de product types.
- **Razón**: El frontend ya no tendrá que manipular la lógica de construcción. Además, se centraliza la lógica y se puede reutilizar en otros clientes.

## Risks / Trade-offs

- **Riesgo**: Usuarios que no tienen Excel o que usan Google Sheets pueden tener problemas si las validaciones no se transfieren perfectamente. → **Mitigación**: Google Sheets soporta data validation básica; se probará en ambos entornos.
- **Riesgo**: El comentario de multiselect puede pasar desapercibido. → **Mitigación**: Añadir también un texto en la fila de ejemplo que use `;` visiblemente.
- **Riesgo**: Archivos Excel generados por el backend pueden ser más grandes que un CSV, pero para un template de una fila será insignificante.
- **Trade-off**: Añade una dependencia al backend (`exceljs`), pero es ligera y bien mantenida.

## Migration Plan

1. Instalar `exceljs` en el backend.
2. Implementar método de generación Excel en `product-type.service.ts`.
3. Adaptar `product-type.controller.ts` para aceptar query param `format`.
4. Actualizar frontend para solicitar `xlsx` y manejar la descarga binaria.
5. Probar con tipos de producto que tengan select, multiselect y boolean.
6. Mantener el endpoint CSV funcional.

## Open Questions

- ¿Debería ser `xlsx` el formato por defecto o seguir siendo CSV por compatibilidad?
- ¿Conviene generar automáticamente el CSV a partir del Excel o mantener dos lógicas separadas?
- En el futuro, si se migra a Google Sheets API, ¿podría eliminarse la generación manual?