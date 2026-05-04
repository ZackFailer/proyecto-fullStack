## Why

El template CSV actual, aunque tenga valores de ejemplo, sigue requiriendo que el usuario escriba manualmente los valores para campos `select` y `multiselect`. Esto provoca errores de tipeo, desconocimiento de las opciones válidas y fricción en el flujo de importación.

Un template en **formato Excel (.xlsx)** puede incluir **validación de datos con listas desplegables** para que el usuario simplemente haga clic y seleccione la opción correcta. Esto reduce drásticamente los errores y mejora la experiencia, incluso para usuarios no técnicos.

## What Changes

- **Nuevo endpoint** o modificación del actual `GET /api/product-types/:id/template` para que acepte un query param `format=csv|xlsx`. Por defecto `xlsx` si no se especifica.
- **Uso de la librería `exceljs`** en el backend para generar archivos `.xlsx` con:
  - Cabeceras de columna.
  - Una fila de ejemplo (como ya se hace).
  - Validación de datos (dropdown) para columnas de tipo `select` y `boolean`.
  - Notas/comentarios para columnas `multiselect` indicando el separador `;`.
- **Frontend**: el botón de descarga obtendrá el archivo binario y lo ofrecerá como descarga con extensión `.xlsx`. Sin cambios visuales significativos.
- **Compatibilidad hacia atrás**: se mantiene el endpoint CSV existente para quien lo prefiera, por si se necesita para otros flujos automatizados.

## Capabilities

### New Capabilities
- **excel-template-download**: Descarga de plantillas Excel con validación de datos contextual.

### Modified Capabilities
- **bulk-product-import**: El proceso de importación no cambia; el template Excel sirve exclusivamente para ayudar al usuario a llenar los datos correctamente.

## Impact

- **Backend**: Nuevo endpoint (o ampliación del existente), instalación de `exceljs`, nueva lógica en servicio de product types.
- **Frontend**: Ajuste ligero en la llamada a la API y nombre del archivo descargado.
- **Base de datos**: Sin cambios.
- **UX**: Mejora significativa para usuarios que completan templates en Excel.