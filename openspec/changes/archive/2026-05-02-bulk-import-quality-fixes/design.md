## Context

El módulo de bulk import existente procesa archivos CSV de productos pero tiene vacíos en validación de datos, control de concurrencia y manejo de tipos deprecados. Este change aborda这些问题 para mejorar la calidad de datos y la experiencia del usuario.

## Goals / Non-Goals

**Goals:**
- Detectar duplicados de SKU/EAN dentro del mismo CSV antes de tocar la base de datos.
- Prevenir importaciones simultáneas en el mismo tenant mediante bloqueo.
- Rechazar explícitamente filas que referencian tipos de producto deprecados.
- Mejorar validación de boolean (solo true/false/1/0) y fecha (formato ISO estricto).
- Limpiar contenido del archivo después de procesar para ahorrar espacio.

**Non-Goals:**
- Cambios en el esquema de la base de datos.
- Modificaciones en la UI del frontend.
- Implementación de notificaciones push/email.
- Procesamiento streaming de archivos grandes (solo si hay evidencia de necesidad).
- Reintentos automáticos más allá de fallos transitorios de persistencia.

## Decisions

### 1. Detección de duplicados intra-CSV
- Decision: Agregar etapa de validación de duplicados antes de la validación de filas.
- Rationale: Evita mensajes de error confusos de la base de datos y da feedback claro al usuario.
- Alternativa: Confiar en índices únicos de BD. Descartado porque la experiencia de usuario es mala.

### 2. Control de concurrencia por tenant
- Decision: Usar índice único parcial en BD + verificación on-demand en código.
- Rationale: El índice único en BD previene race conditions. La verificación on-demand permite manejar timeouts sin scheduler.
- Implementación:
  - Índice único: `bulkProcessSchema.index({ tenantId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'processing' } })`
  - Timeout on-demand: Al intentar iniciar, si existe proceso >30 min sin update, se marca como failed y se permite nuevo.
- Alternativa: Locks en memoria. Descartado porque no survive restart y no previene race condition real.

### 3. Tipos de producto deprecados
- Decision: Validar `isActive` del tipo antes de procesar la fila. Si está deprecado, marcar error con mensaje claro.
- Rationale: Mantiene consistencia de negocio y obliga al admin a activar el tipo para nuevas importaciones.

### 3. Tipos de producto deprecados
- Decision: Validar `isActive` del tipo antes de procesar la fila. Si está deprecado, marcar error con mensaje claro.
- Rationale: Mantiene consistencia de negocio y obliga al admin a activar el tipo para nuevas importaciones.

### 4. Validación de boolean más estricta
- Decision: Aceptar solo `true`, `false`, `1`, `0` (case-insensitive). Rechazar otros valores.
- Rationale: Evita datos inválidos silenciosos que pueden romper procesos posteriores.
- Implementación: Comparar con array de valores válidos, case-insensitive.

### 5. Validación de fecha más estricta
- Decision: Exigir formato ISO (YYYY-MM-DD) Y validar que sea fecha real válida.
- Rationale: Consistencia en almacenamiento y evitar rollovers de JS Date (ej. 2024-02-30 → 2024-03-01).
- Implementación: Validar componentes (año número, mes 01-12, día válido para ese mes incluyendo bisiestos).

### 6. Cleanup en finalization
- Decision: Eliminar el campo `fileContent` del proceso después de completar, con manejo de errores robusto.
- Rationale: Ahorra espacio en la base de datos. El archivo original ya no es necesario después de procesar.
- Implementación:
  - Wrapped in try/catch: si falla, registrar warning pero no afectar estado final
  - Considerar retención de 7 días para debugging en versión futura
  - Opcional: permitir descarga desde UI de historial hasta cierto tiempo

## Risks / Trade-offs

- [Risk] El bloqueo por tenant puede bloquear a admins legítimos si un proceso queda varado. → Mitigation: Timeout de 30 minutos para liberar lock automáticamente.
- [Risk] Duplicados detectados pueden ser intentional (diferentes productos con mismo SKU base). → Mitigation: Solo marcar como error si es el mismo SKU exact, no por prefijo.
- [Trade-off] Validación más estricta puede rechazar CSVs que antes pasaban. → Mitigation: Documentar formato esperado y mostrar ejemplos en error.

## Migration Plan

1. Modificar `bulk-import.service.ts` para agregar detección de duplicados.
2. Agregar validación de `isActive` en lookup de product type.
3. Ajustar validación de boolean y date.
4. Agregar cleanup en etapa de finalization.
5. Agregar bloqueo de concurrent imports en routes.
6. Agregar tests para los nuevos escenarios.

## Open Questions

- ¿Cuál debe ser el timeout configurable para liberar lock automáticamente? (actual: 30 min hardcodeado)
- ¿Se debe permitir que el usuario vea/descargue el contenido del archivo después de procesar (para debugging)?
- ¿El cleanup debe ser inmediato o después de N días? (considerar retención de 7 días para soporte)
- ¿Validar también SKU con prefijo de tenant para mayor granularidad?