## Why

Actualmente cada producto es independiente. En la operacion diaria, los administradores necesitan vincular presentaciones relacionadas (por ejemplo, saco de 3 kg y detal de 250 g) y mover stock entre SKU sin perder trazabilidad.

El sistema ya tiene Product Settings con atributos dinamicos por tenant. Esta base permite extender inventario con relaciones y transferencias sin acoplar logica de negocio especifica al core.

## What Changes

- Agregar campo opcional `relatedProducts` en el modelo de producto con elementos `{ sku, type }` para vinculos entre SKU del mismo tenant.
- Agregar endpoint `POST /api/inventory/transfer` para transferir stock 1 a 1 entre dos SKU del mismo tenant.
- Agregar coleccion `InventoryTransfer` para auditoria de transferencias con estado y metadatos de ejecucion.
- Agregar endpoint `GET /api/inventory/transfers` para historial paginado y filtrable por SKU.
- Agregar endpoint `GET /api/products/:sku/related` para consultar productos vinculados.
- Agregar en frontend modal de transferencia en el detalle de producto y seccion de relacionados.
- No modificar bulk import CSV en esta fase; transferencia masiva queda fuera de alcance.

## Capabilities

### New Capabilities
- `product-relations`: Vinculacion opcional entre productos por SKU con tipificacion de relacion y consulta de relacionados.
- `inventory-transfer`: Transferencia de stock 1 a 1 entre SKU del mismo tenant con atomicidad, auditoria e historial.

### Modified Capabilities
- None.

## Impact

- Backend: cambios en `backend/src/models/product.model.ts`, nuevos modelo/servicio/controlador/router para transferencias, y endpoint para relacionados.
- Frontend: cambios en pagina de detalle de producto, nuevos flujos API/data para transferir y listar relacionados.
- Base de datos: nueva coleccion `InventoryTransfer` e indices de consulta para historial y limpieza de pendientes.
- Seguridad y roles: `admin` ejecuta transferencias; `admin` y `operator` consultan historial/relacionados; `viewer` sin permisos de escritura.
