# Tareas para bulk-import-upsert

## 1. Refactor de lógica de procesamiento de filas para upsert

- [x] 1.1 Modificar `validateAndProcessRow` para que busque producto por SKU en toda la colección (incluyendo status 'inactive').
- [x] 1.2 Implementar rama de decisión:
  - Si no existe → crear nuevo.
  - Si existe y status es 'active' → actualizar (patch).
  - Si existe y status es 'inactive' → reactivar (status = 'active') y actualizar.
- [x] 1.3 Ajustar la actualización para que solo modifique campos presentes en el CSV (patch). Si un campo no está en la fila, no se altera.
- [x] 1.4 Agregar registro de acción en el resultado por fila: `action: 'created' | 'updated' | 'reactivated' | 'error'`.

## 2. Columna de acción `action` (opcional)

- [x] 2.1 Durante el parseo del CSV, aceptar columna con nombre normalizado `action` (case-insensitive).
- [x] 2.2 Validar valores permitidos: `active`, `inactive`, `deleted`. Si no está presente → `active`.
- [x] 2.3 Si `action` es `inactive` y el producto no existe → error: "No se puede desactivar un producto inexistente".
- [x] 2.4 Si `action` es `deleted` y el producto no existe → error: "No se puede eliminar un producto inexistente".
- [x] 2.5 Si el producto existe y `action=inactive` → poner `status = 'inactive'` y contar como `deactivated`.
- [x] 2.6 Si el producto existe y `action=deleted` → establecer `status = 'inactive'` y contar como `deleted` (incluso si ya estaba inactivo, se registra éxito).
- [x] 2.7 Si `action=active` y el producto estaba inactivo → reactivarlo y actualizar; contar como `reactivated`.

## 3. Ajuste de estado del proceso y contadores

- [x] 3.1 Agregar al modelo `BulkProcess` los campos: `created`, `updated`, `reactivated`, `deactivated`, `deleted` (todos Number, default 0).
- [x] 3.2 Actualizar el servicio de tracking para incrementar estos contadores según la acción realizada por fila.
- [x] 3.3 Implementar nueva lógica de estado final:
  - Si `successItems` es igual al total de filas → `completed`.
  - Si `successItems === 0` y `errorItems > 0` → `failed`.
  - Si `successItems > 0` y `errorItems > 0` → `partial`.
- [x] 3.4 El campo `status` del proceso debe reflejar el resultado tras finalización.

## 4. Mejora del archivo de errores

- [x] 4.1 Modificar la generación del archivo de errores para que incluya todas las columnas originales del CSV.
- [x] 4.2 Agregar columna `accion_intentada` (valor: `created`/`updated`/`reactivated`/`deactivated`/`deleted`).
- [x] 4.3 Agregar columna `error` con el mensaje de validación o sistema.
- [x] 4.4 Asegurar que el archivo de errores se pueda descargar en formato CSV con los mismos delimitadores.

## 5. Ajustes en validación

- [x] 5.1 Eliminar la validación que rechaza SKU existente en BD (deja de ser un error, excepto duplicados intra-CSV).
- [x] 5.2 Mantener validación de formato de SKU (no vacío, longitud máxima, caracteres permitidos).
- [x] 5.3 Validar que un SKU nuevo no cree conflicto con un SKU que pertenece a un producto activo pero con diferente `productTypeId`? No, el sistema permite cualquier SKU nuevo; la unicidad solo se exige por SKU.
- [x] 5.4 Si `action` está presente, validar su valor en un paso temprano.

## 6. Actualización de respuestas de API

- [x] 6.1 El endpoint de detalle de proceso debe retornar `created`, `updated`, `reactivated`, `deactivated`, `deleted` junto con `successItems`.
- [x] 6.2 Incluir en la respuesta de historial el estado `failed` cuando corresponda.

## 7. Tests de integración

- [x] 7.1 Test: CSV con un SKU nuevo → se crea (acción `created`).
- [x] 7.2 Test: CSV con SKU existente activo → se actualiza (acción `updated`), no se crea duplicado.
- [x] 7.3 Test: CSV con SKU de producto inactivo → se reactiva y actualiza (acción `reactivated`).
- [x] 7.4 Test: CSV con `action: inactive` en producto existente → se desactiva.
- [x] 7.5 Test: CSV con `action: deleted` en producto existente → se marca como inactivo.
- [x] 7.6 Test: Mezcla de creaciones, actualizaciones y errores → proceso `partial` con contadores correctos.
- [x] 7.7 Test: CSV donde todas las filas fallan → proceso `failed`, contador de éxitos = 0.
- [x] 7.8 Test: CSV con `action: deleted` en producto inexistente → error de fila.
- [x] 7.9 Test: Archivo de errores generado contiene columnas originales y mensajes.
- [x] 7.10 Test: Concurrencia con upsert (dos imports simultáneos con mismo SKU reactivado) – el lock por tenant debe prevenir problemas.

## 8. Frontend

- [x] 8.1 Actualizar la UI de bulk-import para mostrar contadores diferenciados (created/updated/reactivated).
- [x] 8.2 Mostrar correctamente el estado `failed` cuando corresponde.
- [x] 8.3 En el diálogo de errores, mostrar la acción intentada y el error.
