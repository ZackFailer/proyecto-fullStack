# Proposal: add-product-relationship-management

## Why

La plataforma ya puede almacenar y consultar relaciones entre productos en el backend, pero hoy esas relaciones no se pueden cargar desde la importacion masiva ni gestionarse desde la interfaz. Eso deja el endpoint `GET /api/products/:sku/related` sin datos reales en la mayoria de los casos y obliga a depender de llamadas manuales a la API para mantener relaciones.

## What Changes

- Se amplia la importacion masiva de productos para aceptar una columna `relatedProducts` en CSV y en las plantillas Excel/CSV.
- Se define un formato de carga `SKU:type` separado por comas, por ejemplo `SKU-002:variant-of,SKU-003:component-of`.
- Se cambia la validacion de importacion para tolerar relaciones invalidas o inexistentes: el producto se importa igual y la relacion invalida se omite sin bloquear la fila.
- Se agrega gestion manual de relaciones en el detalle del producto para administradores, incluyendo alta y baja de relaciones unidireccionales.
- Se actualiza la representacion de producto en frontend para soportar `relatedProducts` como dato editable ademas de la vista de relacionados resueltos.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `product-relations`: cambia la forma en que se crean y administran relaciones para incluir carga por importacion masiva y edicion manual desde la UI.
- `bulk-product-import`: cambia la importacion para aceptar y procesar relaciones de productos sin bloquear la fila cuando alguna relacion no puede resolverse.
- `excel-template-download`: cambia las plantillas para incluir la columna `relatedProducts` y ejemplos compatibles con el parser de importacion.

## Impact

- **Backend**: cambios en `bulk-import.service.ts`, `product-type.service.ts`, contratos de producto y validacion de relaciones para soportar importacion tolerante a errores.
- **Frontend**: cambios en interfaces, APIs y pagina de detalle de producto para editar relaciones desde la UI.
- **API**: se reutilizan los endpoints de creacion y actualizacion de productos para persistir `relatedProducts`; el endpoint `GET /api/products/:sku/related` pasa a tener una fuente de datos operable desde importacion y UI.
- **Operaciones**: las plantillas descargables y el flujo de carga masiva pasan a documentar y soportar relaciones unidireccionales entre SKU del mismo tenant.
