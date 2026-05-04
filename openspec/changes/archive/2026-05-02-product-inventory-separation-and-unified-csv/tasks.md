# Tareas por Fase

## Fase 1: Separación de features y CSV multi-tipo

### 1.1 Reorganización de features en frontend

- [x] 1.1.1 Crear estructura de módulos: `features/tenant/products` y `features/tenant/inventory`
- [x] 1.1.2 Mover páginas existentes: tipos de producto y bulk import → Products
- [x] 1.1.3 Crear página `inventory/product-list` (tabla con SKU, nombre, tipo, stock, precio)
- [x] 1.1.4 Crear página `inventory/product-detail/:sku` (datos completos, stock, relacionados)
- [x] 1.1.5 Actualizar menú lateral con separación Productos / Inventario

### 1.2 Mapeo csvColumn en ProductType

- [x] 1.2.1 Agregar campo `csvColumn: number` (1-10, obligatorio) al subdocumento de atributos en `ProductType`
- [x] 1.2.2 Validar unicidad de `csvColumn` dentro del mismo tipo
- [x] 1.2.3 Script de migración para asignar `csvColumn` automático a atributos existentes según orden actual
- [x] 1.2.4 Actualizar DTOs y validaciones en backend

### 1.3 Template Excel multi-hoja (una hoja por tipo + Consolidado)

- [x] 1.3.1 Crear endpoint `GET /api/product-types/template?all=true`
- [x] 1.3.2 Instalar/actualizar `exceljs` en backend
- [x] 1.3.3 Generar una hoja por tipo de producto activo
- [x] 1.3.4 Generar hoja "Consolidado" con fórmulas IF
- [x] 1.3.5 Devolver archivo `.xlsx` con todas las hojas
- [x] 1.3.6 Frontend: botón "Descargar plantilla general" en página Bulk Import

### 1.4 CSV parser multi-tipo

- [x] 1.4.1 Detectar formato automáticamente
- [x] 1.4.2 Implementar parseo Formato A (attr_1..10)
- [x] 1.4.3 Mantener parseo Formato B (nombres reales) existente
- [x] 1.4.4 Atributos no mapeados se ignoran
- [x] 1.4.5 Tests para ambos formatos

### 1.5 Template por tipo (existente, se mantiene)

- [x] 1.5.1 Conservar endpoint `GET /api/product-types/:id/template` sin cambios

## Fase 2: Transferencia de inventario

### 2.1 Backend

- [x] 2.1.1 Agregar campo `conversionAttribute: string` (opcional) a `ProductType`
- [x] 2.1.2 Validar que `conversionAttribute` referencie un atributo `number` del mismo tipo
- [x] 2.1.3 Agregar campo `relatedProducts: [{ sku, type }]` a `Product`
- [x] 2.1.4 Modelo `InventoryTransfer`
- [x] 2.1.5 Servicio con `previewTransfer()` y `transferInventory()`
- [x] 2.1.6 Implementar fallback standalone (two-phase write)
- [x] 2.1.7 Endpoint `POST /api/inventory/transfer` (rol admin)
- [x] 2.1.8 Endpoint `GET /api/inventory/transfers?sku=&page=` (roles admin, operator)
- [x] 2.1.9 Endpoint `GET /api/products/:sku/related` (roles admin, operator)

### 2.2 Frontend

- [x] 2.2.1 Página `inventory/product-detail`: stock, atributos, productos relacionados
- [x] 2.2.2 Modal de transferencia
- [x] 2.2.3 Página `inventory/transfer-history`
- [x] 2.2.4 Toast de confirmación al transferir

## Fase 3: Auditoría y trazabilidad

### 3.1 Descarga de archivo original

- [x] 3.1.1 Endpoint `GET /api/bulk-process/:id/file`
- [x] 3.1.2 Botón de descarga en detalle de proceso

### 3.2 Timeline de movimientos en detalle de producto

- [x] 3.2.1 Endpoint `GET /api/products/:sku/timeline`
- [x] 3.2.2 Componente timeline en `inventory/product-detail`

### 3.3 Deshacer transferencia

- [x] 3.3.1 Endpoint `POST /api/inventory/transfer/:id/rollback`
- [x] 3.3.2 ValidarTransfer original completada y no revertida
- [x] 3.3.3 Crear transferencia inversa
- [x] 3.3.4 Botón "Deshacer" en historial

## Fase 4: Rollback y ajustes (futuro)

### 4.1 Rollback de BulkProcess

- [ ] 4.1.1 Extender `ItemProcessLog` con `previousValues`
- [ ] 4.1.2 Endpoint `POST /api/bulk-process/:id/rollback`
- [ ] 4.1.3 Botón "Revertir carga" en detalle de proceso (rol admin)

### 4.2 Ajuste manual de stock

- [ ] 4.2.1 Modelo `StockAdjustment`
- [ ] 4.2.2 Endpoint `POST /api/inventory/adjust`
- [ ] 4.2.3 Modal de ajuste en detalle de producto
