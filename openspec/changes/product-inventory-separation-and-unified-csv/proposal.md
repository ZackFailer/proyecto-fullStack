## Why

Actualmente las funcionalidades de productos e inventario están mezcladas, y el bulk import obliga a cargar un CSV por cada tipo de producto. Esto genera:

1. **Fricción operativa**: un administrador con 10 tipos de producto debe hacer 10 cargas separadas. En la práctica quiere cargar todo su catálogo de una vez.
2. **Falta de separación de responsabilidades**: no hay una frontera clara entre catálogo (productos) y stock/movimientos (inventario), lo que dificulta el mantenimiento y la experiencia del usuario.
3. **Ayuda visual sacrificada si se unifica**: un solo CSV multi-tipo no puede tener dropdowns de Excel por tipo. Se necesita una solución que unifique la carga pero conserve las ayudas visuales.

## What Changes

- **Feature Productos**: tipos de producto, carga masiva multi-tipo (un solo Excel para todo el tenant), historial de procesos, descarga del archivo original.
- **Feature Inventario**: lista de productos con vista de inventario, detalle con stock e historial de movimientos, transferencia de inventario entre SKUs (solo desde UI), historial de transferencias.
- **Template Excel multi-tipo con una hoja por tipo**: cada tipo de producto tiene su propia hoja con columnas nombradas y dropdowns. Una hoja "Consolidado" unifica todas las filas con columnas normalizadas `attr_1..10` lista para exportar a CSV e importar.
- **CSV parser multi-tipo**: acepta tanto columnas con nombres reales de atributos (por tipo) como columnas normalizadas `attr_1..10` (multi-tipo), detectando automáticamente el formato.
- **Sin transferencias desde CSV**: el CSV solo crea, actualiza y da de baja productos. Las transferencias son exclusivas de la UI de Inventario.
- **Relaciones entre productos**: campo `relatedProducts` en `Product` para vincular presentaciones.
- **Transferencia con conversión configurable**: cada `ProductType` puede definir un `conversionAttribute` para habilitar conversión automática al transferir.

## Capabilities

### New Capabilities
- **unified-excel-template**: Un solo archivo Excel con múltiples hojas (una por tipo) + hoja consolidada.
- **multi-type-csv-import**: Un solo CSV para cargar productos de cualquier tipo.
- **inventory-transfer**: Transferencia de stock con conversión configurable.
- **product-inventory-separation**: Features independientes con responsabilidades claras.

### Modified Capabilities
- **bulk-product-import**: Requiere soportar múltiples tipos de producto en un solo CSV.
- **product-type-management**: Añadir mapeo `csvColumn` y `conversionAttribute` a los atributos.
- **inventory-management**: Nuevo modelo y endpoints para transferencias.

## Impact

- **Backend**: Refactor del parser CSV, generación de Excel multi-hoja, nuevos endpoints de inventario, nueva colección `InventoryTransfer`.
- **Frontend**: Reorganización en dos features, modal de transferencia, templates duales.
- **Base de datos**: Nueva colección `InventoryTransfer`. Campo `csvColumn` en atributos de `ProductType`.