## 1. Plantillas y contrato de importacion

- [x] 1.1 Agregar `relatedProducts` a las columnas base de las plantillas CSV, Excel por tipo y Excel general consolidado.
- [x] 1.2 Actualizar los valores de ejemplo y ayudas visuales para mostrar el formato `SKU:type` en una sola celda de `relatedProducts`.
- [x] 1.3 Verificar que la exportacion a CSV desde Excel preserve `relatedProducts` como una unica celda citada cuando contenga multiples relaciones.

## 2. Parser y validacion de bulk import

- [x] 2.1 Reemplazar el parseo CSV basado en `split(',')` por uno que soporte comillas, comas internas y comillas escapadas.
- [x] 2.2 Parsear la columna `relatedProducts` desde cada fila hacia una estructura temporal de relaciones candidatas.
- [x] 2.3 Validar formato, duplicados y autoreferencias de `relatedProducts` separando errores fatales de relaciones omitibles.
- [x] 2.4 Mantener compatibilidad con el formato actual de atributos (`attr_n`) y con imports sin columna `relatedProducts`.

## 3. Persistencia tolerante de relaciones en importacion

- [x] 3.1 Extender el pipeline de `executeBulkImport` para resolver relaciones contra productos existentes en base de datos y SKU importados exitosamente en el mismo proceso.
- [x] 3.2 Persistir los productos validos aunque alguna relacion no pueda resolverse.
- [x] 3.3 Actualizar `relatedProducts` solo con entradas resolubles y omitir las invalidas o inexistentes.
- [x] 3.4 Registrar trazabilidad por fila para relaciones omitidas sin aumentar `errorItems` ni marcar la fila como error.

## 4. Tracking, respuestas y cobertura backend

- [x] 4.1 Exponer warnings o detalles de relaciones omitidas en la consulta de errores/detalles del proceso de importacion.
- [x] 4.2 Agregar tests de backend para parser CSV con celdas citedas y multiples relaciones.
- [x] 4.3 Agregar tests de backend para relaciones resueltas desde base de datos, desde filas previas del mismo archivo y para relaciones omitidas.
- [x] 4.4 Verificar que `GET /api/products/:sku/related` siga retornando solo relaciones resolubles y que no regrese entradas huerfanas.

## 5. Contrato frontend para relaciones de producto

- [x] 5.1 Actualizar `IProduct` y los contratos frontend relacionados para incluir `relatedProducts` como dato editable.
- [x] 5.2 Reutilizar o extender `ProductApi` y/o `ProductDetailData` para guardar relaciones mediante `PUT /api/products/:id`.
- [x] 5.3 Ajustar el flujo de detalle para refrescar producto, relacionados y timeline despues de guardar relaciones.

## 6. UI de edicion de relaciones

- [x] 6.1 Agregar accion de edicion de relaciones en el detalle del producto visible solo para `admin`.
- [x] 6.2 Implementar formulario inline o modal con seleccion de SKU destino y tipo de relacion, evitando cargar productos hasta que el usuario entre al modo de edicion.
- [x] 6.3 Permitir agregar y quitar relaciones unidireccionales desde la UI y guardar la lista completa del producto.
- [x] 6.4 Mantener la vista read-only de relacionados para `operator` y el estado sin acceso para `viewer`.

## 7. Verificacion integral

- [x] 7.1 Probar descarga de plantillas CSV/XLSX, completar `relatedProducts`, exportar CSV e importar correctamente.
- [x] 7.2 Probar importacion parcial donde el producto entra pero una o mas relaciones se omiten con trazabilidad visible.
- [x] 7.3 Probar edicion manual desde el detalle y confirmar que `/api/products/:sku/related` refleja los cambios.
- [x] 7.4 Ejecutar `npm run test` en backend y `npm run build` en frontend, corrigiendo regresiones relacionadas con el cambio.