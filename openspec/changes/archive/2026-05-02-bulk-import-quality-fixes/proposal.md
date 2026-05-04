# Proposal: bulk-import-quality-fixes

## Why

El módulo de importación masiva de productos tiene vacíos críticos que afectan la integridad de datos y la experiencia del usuario:

1. **Duplicados intra-CSV**: Si el mismo SKU/EAN aparece varias veces en el archivo, solo la primera fila se procesa correctamente y las siguientes fallan en BD con error confuso.
2. **Concurrencia**: Dos administradores del mismo tenant pueden iniciar importaciones simultáneas, generando conflictos de SKU/EAN y estados inconsistentes.
3. **Tipos de producto deprecados**: No se valida si el tipo está activo, permitiendo importar contra tipos obsoletos.
4. **Validación laxa**: Boolean acepta cualquier valor (yes, no, verdadero) y fecha acepta strings que JS parsea silenciosamente a fechas inválidas.
5. **Almacenamiento sin cleanup**: El contenido del CSV se guarda en BD pero nunca se limpia después del proceso.

## What Changes

- Agregar detección de duplicados por SKU y EAN dentro del mismo CSV antes de validar contra BD.
- Implementar bloqueo por tenant para prevenir importaciones concurrentes.
- Rechazar filas que referencien tipos de producto con `isActive: false`.
- Ajustar validación de boolean para aceptar solo `true/false/1/0`.
- Ajustar validación de fecha para exigir formato ISO (YYYY-MM-DD).
- Agregar cleanup del contenido del archivo en etapa de finalización.

## Capabilities

- **import-validation**: Validación más robusta de datos de entrada.
- **concurrency-control**: Prevención de imports simultáneos por tenant.

## Impact

- **Backend**: Modificaciones en `bulk-import.service.ts` y `bulk-import.routes.ts`.
- **Tests**: Nuevos casos para duplicados, concurrencia, tipos deprecados, validación estricta.
- **UI**: Sin cambios requeridos.
- **DB**: Sin cambios de esquema.