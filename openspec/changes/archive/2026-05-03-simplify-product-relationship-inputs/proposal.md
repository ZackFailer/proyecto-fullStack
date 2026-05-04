## Why

La carga masiva de relaciones hoy exige escribir cada vinculo como `SKU:type`, lo que vuelve lenta y propensa a errores una tarea operativa que en la practica solo necesita indicar los SKU relacionados. Ademas, el selector de relaciones del detalle de producto no muestra suficiente contexto para distinguir productos candidatos cuando el tipo maneja un atributo numerico de conversion.

## What Changes

- **BREAKING**: la importacion de `relatedProducts` pasara de `SKU:type` a una lista simple de SKU separados por comas, por ejemplo `SKU-002,SKU-003`.
- La importacion seguira resolviendo relaciones dentro del tenant y persistira cada relacion cargada desde archivo con tipo `related` por defecto.
- Las plantillas descargables actualizaran sus ejemplos y ayudas para documentar `relatedProducts` como una lista de SKU, manteniendo la columna existente en las hojas por tipo y en el consolidado.
- La edicion manual de relaciones en la UI mantendra el selector de tipo actual, pero el buscador de productos mostrara `SKU - Nombre (Atributo: valor)` cuando el tipo del producto tenga configurado un `conversionAttribute` numerico con valor disponible.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `bulk-product-import`: cambia el contrato de `relatedProducts` para aceptar solo SKU separados por comas y asignar `related` por defecto durante la importacion.
- `product-relations`: cambia la experiencia de seleccion de productos relacionados para mostrar mas contexto visual sobre cada candidato y alinear las relaciones importadas con el tipo por defecto `related`.
- `excel-template-download`: cambian los ejemplos y ayudas visibles de `relatedProducts` para reflejar listas simples de SKU sin sufijo de tipo.

## Impact

- **Backend**: cambios en el parser y validacion de `relatedProducts` dentro de `bulk-import.service.ts`, y en los ejemplos generados por las plantillas CSV/XLSX.
- **Frontend**: cambios en `product-detail.ts` y servicios asociados para enriquecer el selector de productos relacionados con nombre, SKU y atributo de conversion.
- **API/Contratos**: no se agregan nuevos endpoints; la UI puede reutilizar `GET /api/products` y la metadata de tipos de producto para construir el texto enriquecido del selector.
- **Operacion**: los usuarios cargaran relaciones en importacion con un formato mas simple, mientras que la asignacion de tipos distintos de `related` quedara reservada a la edicion manual desde la interfaz.
