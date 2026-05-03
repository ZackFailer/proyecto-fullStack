## 1. Duplicados intra-CSV

- [x] 1.1 Agregar función `detectDuplicateSKUs(rows)` que retorna Map<SKU, rowNumbers[]>
- [x] 1.2 Agregar función `detectDuplicateEANs(rows)` que retorna Map<EAN, rowNumbers[]>
- [x] 1.3 Modificar etapa de validación para marcar filas duplicadas con error "SKU duplicado en las filas X, Y"
- [x] 1.4 Las filas sin duplicados se procesan normalmente (solo fallan las duplicadas)
- [x] 1.5 Agregar tests para escenario de SKU duplicado y EAN duplicado en mismo CSV

## 2. Concurrencia entre imports

- [x] 2.1 Agregar índice único parcial en BD: bulkProcessSchema.index({ tenantId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'processing' } })
- [x] 2.2 Agregar función `checkAndAcquireImportLock(tenantId)` que use el índice único (integrado en startBulkImport)
- [x] 2.3 Modificar `startBulkImport` para usar el lock de BD + verificación on-demand
- [x] 2.4 Retornar 409 Conflict si ya hay import en progreso (error de índice único)
- [x] 2.5 Implementar verificación on-demand de timeout: si proceso active tiene >30 min sin update, marcar como failed "timeout" y permitir nuevo
- [x] 2.6 Liberar lock cuando proceso alcance estado terminal
- [x] 2.7 Agregar tests para escenario de imports concurrentes (incluir caso de race condition con índice único)

## 3. Tipos de producto deprecados

- [x] 3.1 Modificar `findProductType` para retornar también `isActive`
- [x] 3.2 En validación de fila, chequear si `productType.isActive === false`
- [x] 3.3 Agregar error "El tipo de producto 'X' está obsoleto y no permite nuevas importaciones"
- [x] 3.4 Agregar tests para escenario de import con tipo deprecado

## 4. Validación estricta de boolean

- [x] 4.1 Modificar validación de boolean en validateRow
- [x] 4.2 Aceptar solo: 'true', 'false', '1', '0' (case-insensitive)
- [x] 4.3 Rechazar otros valores (yes, no, verdadero, etc.) con mensaje claro
- [x] 4.4 Agregar tests para valores válidos e inválidos

## 5. Validación estricta de fecha

- [x] 5.1 Modificar validación de date en validateRow
- [x] 5.2 Exigir formato ISO YYYY-MM-DD Y validar que sea fecha real válida
- [x] 5.3 Validar: año (número), mes (01-12), día válido para ese mes (incluye bisiestos)
- [x] 5.4 Rechazar fechas inválidas como "2024-02-30" o "2024-13-01"
- [x] 5.5 Agregar tests para valores válidos e inválidos (incluir casos edge de meses/días)

## 6. Cleanup de archivo en finalización

- [x] 6.1 Modificar etapa de finalization en executeBulkImport
- [x] 6.2 Eliminar campo `fileContent` del proceso (usar FieldSpecifier para excluir en update)
- [x] 6.3 Envolver cleanup en try/catch: si falla, registrar warning pero no cambiar estado del proceso
- [x] 6.4 Mantener metadatos (filename, fileSize, status, contadores)
- [ ] 6.5 [FUTURO] Considerar retención de 7 días para debugging o descarga desde UI
- [x] 6.6 Agregar test para verificar cleanup exitoso y para verificar que fallo de cleanup no afecta estado

## 7. Tests de integración

- [x] 7.1 Tests de duplicados intra-CSV (incluir archivo mixto: algunos duplicados, otros válidos)
- [x] 7.2 Tests de concurrencia (verificar que índice único previene race condition)
- [x] 7.3 Tests de timeout on-demand (>30 min permite nueva importación)
- [x] 7.4 Tests de tipos deprecados
- [x] 7.5 Tests de validación estricta boolean/date (incluir casos edge)
- [x] 7.6 Tests de cleanup (success y failure)

## 8. Verificación final

- [x] 8.1 Ejecutar todos los tests del backend
- [x] 8.2 Verificar que el build del frontend pase
- [x] 8.3 Probar manualmente los escenarios