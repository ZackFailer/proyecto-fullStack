# Proposal: bulk-import-upsert

## Why

Actualmente la importación masiva solo crea productos. Cuando se reimporta el mismo CSV, todas las filas fallan por SKU duplicado y el proceso termina con estado `partial`, pero el resumen puede mostrar "0 importados, 0 errores" o resultar confuso. Además, los productos que fueron dados de baja (status: inactive) siguen ocupando el SKU e impiden su reactivación vía importación.

Los administradores necesitan poder subir un catálogo maestro periódicamente sin preocuparse por si un producto ya existe, debe actualizarse o si estaba dado de baja. El sistema debe soportar **creación, actualización y reactivación** en un solo flujo, con mensajes claros sobre cada acción realizada.

## What Changes

- El import ahora realiza **upsert**: si el SKU ya pertenece a un producto activo, lo actualiza; si pertenece a un producto inactivo, lo reactiva y actualiza; si no existe, lo crea.
- Se ajusta la lógica de estado del proceso: si todas las filas fallan, el proceso se marca como `failed`; si hay mezcla de éxitos y fallos, `partial`; si todo es éxito, `completed`.
- Se añade al resumen del proceso el desglose exacto de creaciones, actualizaciones y reactivaciones realizadas.
- Se mejora la retroalimentación visual para el usuario: el detalle de fila incluye la acción aplicada (created/updated/reactivated) y el archivo de errores se enriquece con la columna `acción` y `motivo_error`.
- Opcionalmente se admite una columna `action` en el CSV con valores `active`, `inactive`, `deleted` para que la importación pueda también desactivar o eliminar lógicamente productos masivamente.

## Capabilities

- **import-upsert**: Permite crear o actualizar productos en una misma operación.
- **status-reactivation**: Si el CSV contiene un SKU de un producto previamente dado de baja (status: inactive), este se reactiva y actualiza.
- **process-status-refinement**: Corrige el estado del proceso para reflejar fielmente el resultado (failed si éxitos=0).
- **improved-import-feedback**: Proporciona contadores de creaciones, actualizaciones y reactivaciones, además de errores detallados.

## Impact

- **Backend**: `bulk-import.service.ts` se modifica para implementar upsert, reactivación de productos inactivos y la nueva lógica de estado. Se actualiza el esquema de `BulkProcess` para incluir contadores de created/updated/reactivated/deactivated/deleted.
- **Frontend**: Debe mostrar los nuevos contadores, manejar el estado `failed` correctamente y ofrecer descarga del archivo de errores ampliado.
- **Base de datos**: Sin cambios de esquema. Se usa el campo `status` existente ('active'/'inactive').
- **Seguridad / Roles**: Sin cambios.