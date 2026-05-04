## 1. Actualizar contrato de importacion de relaciones

- [x] 1.1 Cambiar el parser de `relatedProducts` para aceptar solo SKU separados por coma y asignar `related` como tipo por defecto a cada entrada valida.
- [x] 1.2 Ajustar warnings y validaciones de importacion para marcar como formato invalido las entradas vacias, duplicadas, autoreferenciales o con sintaxis obsoleta `SKU:type`.
- [x] 1.3 Verificar que la resolucion tolerante contra productos existentes y SKU del mismo archivo siga funcionando con el nuevo parser.

## 2. Actualizar templates y ejemplos visibles

- [x] 2.1 Actualizar los ejemplos de `relatedProducts` en las plantillas CSV y Excel por tipo para usar formato `SKU-002,SKU-003`.
- [x] 2.2 Ajustar ayudas visuales, comentarios o textos asociados a `relatedProducts` para documentar el formato simplificado.
- [x] 2.3 Verificar que la hoja `Consolidado` conserve la columna `relatedProducts` y propague correctamente los valores desde las hojas por tipo sin cambios estructurales adicionales.

## 3. Enriquecer selector de relaciones en frontend

- [x] 3.1 Extender el modelo local de opciones del selector para incluir `productTypeId`, `customAttributes` y el texto enriquecido a mostrar.
- [x] 3.2 Cargar metadata de tipos de producto al entrar en modo de edicion de relaciones y resolver `conversionAttribute` -> etiqueta -> valor numerico por producto.
- [x] 3.3 Mostrar cada opcion del selector como `SKU - Nombre (Atributo: valor)` cuando exista dato de conversion y usar fallback `SKU - Nombre` en los demas casos.
- [x] 3.4 Mantener intacto el selector de tipo de relacion manual (`derived-from`, `component-of`, `variant-of`, `related`) y el guardado actual por `PUT /api/products/:id`.

## 4. Cobertura y verificacion

- [ ] 4.1 Agregar o actualizar tests backend del parser/import para cubrir formato simple, sintaxis obsoleta `SKU:type`, duplicados y self-reference.
- [x] 4.2 Verificar manualmente que la plantilla descargada muestre ejemplos simples de `relatedProducts` y que la importacion persista tipo `related` por defecto.
- [x] 4.3 Verificar manualmente en frontend que el selector de relaciones muestre `SKU - Nombre (Atributo: valor)` cuando aplique y fallback estable cuando no.
- [x] 4.4 Ejecutar `npm run test` en backend y `npm run build` en frontend, corrigiendo cualquier regresion relacionada.

## 5. Corregir formulas en Consolidado para productTypeId y productTypeVersion

- [ ] 5.1 Cambiar columnas 4 y 5 en Consolidado de valores fijos a formulas que referencien las hojas de tipo.
- [x] 5.2 Verificar build del backend.

## 6. Ignorar filas vacías en importacion CSV

- [x] 6.1 Agregar check para skip filas cuando SKU está vacío.
- [x] 6.2 Verificar build del backend.