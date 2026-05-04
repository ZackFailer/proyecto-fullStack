# Tareas por Fase

## Fase 1: Separación de features y CSV multi-tipo

### 1.1 Reorganización de features en frontend

- [ ] 1.1.1 Crear estructura de módulos: `features/tenant/products` y `features/tenant/inventory`
- [ ] 1.1.2 Mover páginas existentes: tipos de producto y bulk import → Products
- [ ] 1.1.3 Crear página `inventory/product-list` (tabla con SKU, nombre, tipo, stock, precio)
- [ ] 1.1.4 Crear página `inventory/product-detail/:sku` (datos completos, stock, relacionados)
- [ ] 1.1.5 Actualizar menú lateral con separación Productos / Inventario

### 1.2 Mapeo csvColumn en ProductType

- [ ] 1.2.1 Agregar campo `csvColumn: number` (1-10, obligatorio) al subdocumento de atributos en `ProductType`
- [ ] 1.2.2 Validar unicidad de `csvColumn` dentro del mismo tipo
- [ ] 1.2.3 Script de migración para asignar `csvColumn` automático a atributos existentes según orden actual
- [ ] 1.2.4 Actualizar DTOs y validaciones en backend

### 1.3 Template Excel multi-hoja (una hoja por tipo + Consolidado)

- [ ] 1.3.1 Crear endpoint `GET /api/product-types/template?all=true`
- [ ] 1.3.2 Instalar/actualizar `exceljs` en backend
- [ ] 1.3.3 Generar una hoja por tipo de producto activo
- [ ] 1.3.4 Generar hoja "Consolidado" con fórmulas IF
- [ ] 1.3.5 Devolver archivo `.xlsx` con todas las hojas
- [ ] 1.3.6 Frontend: botón "Descargar plantilla general" en página Bulk Import

### 1.4 CSV parser multi-tipo

- [ ] 1.4.1 Detectar formato automáticamente
- [ ] 1.4.2 Implementar parseo Formato A (attr_1..10)
- [ ] 1.4.3 Mantener parseo Formato B (nombres reales) existente
- [ ] 1.4.4 Atributos no mapeados se ignoran
- [ ] 1.4.5 Tests para ambos formatos

### 1.5 Template por tipo (existente, se mantiene)

- [ ] 1.5.1 Conservar endpoint `GET /api/product-types/:id/template` sin cambios

## Fase 2: Transferencia de inventario

### 2.1 Backend

- [ ] 2.1.1 Agregar campo `conversionAttribute: string` (opcional) a `ProductType`
- [ ] 2.1.2 Validar que `conversionAttribute` referencie un atributo `number` del mismo tipo
- [ ] 2.1.3 Agregar campo `relatedProducts: [{ sku, type }]` a `Product`
- [ ] 2.1.4 Modelo `InventoryTransfer`
- [ ] 2.1.5 Servicio con `previewTransfer()` y `transferInventory()`
- [ ] 2.1.6 Implementar fallback standalone (two-phase write)
- [ ] 2.1.7 Endpoint `POST /api/inventory/transfer` (rol admin)
- [ ] 2.1.8 Endpoint `GET /api/inventory/transfers?sku=&page=` (roles admin, operator)
- [ ] 2.1.9 Endpoint `GET /api/products/:sku/related` (roles admin, operator)

### 2.2 Frontend

- [ ] 2.2.1 Página `inventory/product-detail`: stock, atributos, productos relacionados
- [ ] 2.2.2 Modal de transferencia
- [ ] 2.2.3 Página `inventory/transfer-history`
- [ ] 2.2.4 Toast de confirmación al transferir

## Fase 3: Auditoría y trazabilidad

### 3.1 Descarga de archivo original

- [ ] 3.1.1 Endpoint `GET /api/bulk-process/:id/file`
- [ ] 3.1.2 Botón de descarga en detalle de proceso

### 3.2 Timeline de movimientos en detalle de producto

- [ ] 3.2.1 Endpoint `GET /api/products/:sku/timeline`
- [ ] 3.2.2 Componente timeline en `inventory/product-detail`

### 3.3 Deshacer transferencia

- [ ] 3.3.1 Endpoint `POST /api/inventory/transfer/:id/rollback`
- [ ] 3.3.2 ValidarTransfer original completada y no revertida
- [ ] 3.3.3 Crear transferencia inversa
- [ ] 3.3.4 Botón "Deshacer" en historial

## Fase 4: Rollback y ajustes (futuro)

### 4.1 Rollback de BulkProcess

- [ ] 4.1.1 Extender `ItemProcessLog` con `previousValues`
- [ ] 4.1.2 Endpoint `POST /api/bulk-process/:id/rollback`
- [ ] 4.1.3 Botón "Revertir carga" en detalle de proceso (rol admin)

### 4.2 Ajuste manual de stock

- [ ] 4.2.1 Modelo `StockAdjustment`
- [ ] 4.2.2 Endpoint `POST /api/inventory/adjust`
- [ ] 4.2.3 Modal de ajuste en detalle de producto