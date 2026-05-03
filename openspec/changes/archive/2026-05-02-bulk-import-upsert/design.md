## Context

El módulo de importación masiva actual solo admite creación de productos. Cuando una fila tiene un SKU existente (activo o inactivo), se registra un error por duplicado y el proceso puede finalizar con éxito parcial pero pobre retroalimentación. Los administradores necesitan mantener el catálogo completo mediante importaciones periódicas, lo que exige **upsert** y una interacción fluida con el campo status.

## Goals / Non-Goals

**Goals:**
- Convertir el import en **upsert** basado en SKU: si el SKU existe y está activo, actualizar; si existe pero con status 'inactive', reactivar (status = 'active') y actualizar; si no existe, crear.
- Ajustar el estado del proceso: `failed` cuando 0 filas exitosas (sin importar errores), `partial` cuando hay mezcla, `completed` cuando 100% éxito.
- Registrar y comunicar la acción realizada por fila (created, updated, reactivated, error).
- Agregar (opcional) columna `action` en el CSV para permitir desactivación o eliminación lógica desde la importación.
- Mejorar el archivo de errores: incluir columnas originales, acción intentada y motivo del error.

**Non-Goals:**
- Actualización parcial con estrategia de merge compleja (si un campo no está en el CSV, se conserva el valor existente; política de "patch" simple).
- Versionado de cambios de productos tras actualización (histórico completo).
- Eliminación física de productos vía importación.
- Migración automática de importaciones antiguas al nuevo comportamiento.

## Decisions

### 1. Upsert por SKU con reactivación via status
- **Decisión**: Al procesar una fila, buscar producto por SKU (sin filtrar por status). Si se encuentra:
  - Si status es 'active' → actualizar campos (patch).
  - Si status es 'inactive' → reactivar (status = 'active') y actualizar.
  - Si no existe → crear nuevo.
- **Razón**: El campo status ya existe y permite distinguir productos dados de baja.

### 2. Política de actualización parcial ("patch")
- **Decisión**: Solo se actualizan los campos presentes en el CSV. Si una columna (ej. `stock`) no aparece en la fila, se mantiene el valor actual del producto.
- **Razón**: La mayoría de los catálogos exportados desde otras herramientas traen un subconjunto de columnas; no queremos borrar información no incluida.

### 3. Columna de acción `action` (opcional)
- **Decisión**: Aceptar una columna opcional `action` con valores:
  - `active`: reactiva producto si estaba inactivo/eliminado, y actualiza (comportamiento normal de upsert).
  - `inactive`: desactiva (`status = 'inactive'`) si el producto existe.
  - `deleted`: marca como inactivo (`status = 'inactive'`) si existe (mismo comportamiento que inactive por ahora).
  - Si no está presente, se asume `active`.
  - Si la fila es nueva (SKU no existe) y la acción es `inactive`/`deleted` → error lógico.
- **Razón**: Permite dar de baja productos masivamente sin necesidad de otra herramienta.

### 4. Lógica de estado del proceso
- **Decisión**: `failed` si successItems === 0 y errorItems > 0. `partial` si successItems > 0 y errorItems > 0. `completed` si errorItems === 0.
- Además se agregan contadores: `created`, `updated`, `reactivated`, `deactivated` (y `deleted` si aplica).
- **Razón**: El usuario necesita saber inmediatamente si el archivo no aportó ningún producto válido.

### 5. Archivo de errores enriquecido
- **Decisión**: El archivo descargable de errores contendrá todas las columnas del CSV original más dos nuevas: `accion_intentada` y `error`. Para las filas exitosas no se genera entrada.
- **Razón**: El administrador puede corregir el archivo sabiendo qué acción esperaba y qué falló.

## Riesgos / Mitigaciones

- **Riesgo**: Índice único de SKU incluye productos con status 'inactive'. Si la actualización compite con una creación manual, podría haber conflicto. → **Mitigación**: La lógica de upsert se ejecuta en una transacción; si el documento fue alterado concurrentemente, se reintenta una vez.
- **Riesgo**: Actualizaciones masivas pueden sobreescribir cambios hechos manualmente mientras se preparaba el CSV. → **Mitigación**: No se implementa bloqueo pesimista. Se asume que el CSV es la fuente de verdad durante el mantenimiento del catálogo. Se documenta.
- **Riesgo**: La interpretación de columnas ausentes como "no tocar" podría dejar campos obsoletos. → **Mitigación**: La documentación recomienda incluir todas las columnas que se desean actualizar.

## Plan de migración

1. Modificar el servicio de importación para soportar búsqueda SKU sin filtrar por status y aplicar upsert.
2. Actualizar la lógica de validación: la existencia de SKU ya no es error general, solo se valida formato y unicidad intra-CSV.
3. Añadir procesamiento de columna `action` opcional.
4. Actualizar el modelo `BulkProcess` para incluir contadores `created`, `updated`, `reactivated`, `deactivated`, `deleted`.
5. Ajustar la determinación del estado final del proceso según las nuevas reglas.
6. Mejorar la generación del archivo de errores.
7. Actualizar los endpoints de consulta de proceso para exponer los nuevos contadores.
8. Realizar pruebas de integración para todos los escenarios (creación, actualización, reactivación, desactivación, errores mixtos).
9. Comunicar a los usuarios del frontend los nuevos contadores y el significado del estado `failed`.

## Open Questions

- ¿Se debe permitir la columna `action` en la primera versión o se deja como mejora futura? (Se incluye desde el inicio).
- ¿Qué política se aplica si un CSV intenta marcar como `deleted` un producto que ya está inactivo? (Sugerencia: éxito silencioso o mensaje informativo).
- ¿Se mantiene el límite de 10 MB para el archivo en modo upsert? (Sí, sin cambios).