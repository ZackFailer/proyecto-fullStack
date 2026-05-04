## Context

El backend ya soporta `relatedProducts` en el modelo `Product` y en los endpoints de alta y actualizacion, y el detalle de producto del frontend ya consume `GET /api/products/:sku/related` para mostrar relaciones resueltas. Sin embargo, el flujo operativo actual no ofrece ninguna forma real de poblar o mantener esas relaciones: la importacion masiva ignora el campo, las plantillas no lo incluyen y la UI solo muestra datos en modo lectura.

El cambio cruza backend y frontend en dos fases conectadas. Primero se extiende el pipeline de bulk import y las plantillas descargables para aceptar relaciones unidireccionales en formato `SKU:type`. Despues se agrega una interfaz de administracion en el detalle del producto para editar la lista `relatedProducts` de forma manual. El comportamiento acordado es tolerante a errores: si una relacion no puede resolverse, el producto se importa igual y la relacion se omite.

Hay una restriccion tecnica importante: el parser CSV actual hace `split(',')`, por lo que no soporta valores con comas dentro de una sola celda. Como el formato requerido para `relatedProducts` usa comas entre relaciones, el cambio necesita endurecer el parser para respetar comillas CSV y permitir celdas como `"SKU-002:variant-of,SKU-003:component-of"`.

## Goals / Non-Goals

**Goals:**
- Permitir que las plantillas CSV y Excel incluyan una columna `relatedProducts` con ejemplo y formato documentado.
- Permitir que la importacion masiva cree o actualice `relatedProducts` usando relaciones unidireccionales `SKU:type`.
- Resolver relaciones contra productos ya existentes en el tenant y contra SKU creados o actualizados previamente dentro del mismo archivo importado.
- Omitir relaciones invalidas o inexistentes sin convertir la fila en error fatal ni bloquear la importacion del producto.
- Permitir a `admin` editar relaciones desde el detalle del producto y reutilizar el endpoint `PUT /api/products/:id` existente.
- Mantener el endpoint `GET /api/products/:sku/related` como fuente de lectura de relaciones resueltas para el detalle y validacion visual.

**Non-Goals:**
- No introducir relaciones bidireccionales automaticas.
- No crear una coleccion nueva de relaciones ni cambiar el modelo embebido actual.
- No permitir a `viewer` ni `operator` editar relaciones desde la UI.
- No rehacer el flujo de importacion completa ni cambiar el formato de `attr_n` existente.
- No convertir relaciones invalidas en errores de fila que afecten los contadores actuales de importacion.

## Decisions

### 1. Reutilizar `relatedProducts` embebido y `PUT /api/products/:id`
- **Decision**: mantener `relatedProducts` como arreglo embebido en `Product` y reutilizar `updateProduct` para persistir cambios desde la UI.
- **Rationale**: el modelo, validaciones e indice ya existen, y el frontend solo necesita exponer un flujo de edicion sobre un contrato que el backend ya entiende.
- **Alternatives considered**:
  - Crear endpoints especificos para add/remove relation: rechazado porque duplicaria validaciones ya centralizadas en `product.service.ts`.
  - Crear coleccion dedicada de relaciones: rechazado por complejidad innecesaria para relaciones unidireccionales simples.

### 2. Extender plantillas con una columna base `relatedProducts`
- **Decision**: agregar `relatedProducts` a las columnas base de las plantillas CSV, Excel de un tipo y Excel general consolidado.
- **Rationale**: la relacion debe formar parte del contrato de importacion, no de una convencion externa; la plantilla debe enseñar el formato correcto desde el origen.
- **Alternatives considered**:
  - Soportarlo solo en CSV manual: rechazado porque rompe la consistencia con el flujo de descarga de plantillas.

### 3. Formato de relaciones con parser CSV real y celdas citadas
- **Decision**: mantener el formato funcional acordado `SKU-002:variant-of,SKU-003:component-of`, pero exigir que el valor completo viaje como una sola celda CSV, por ejemplo `"SKU-002:variant-of,SKU-003:component-of"`, y actualizar el parser para respetar comillas.
- **Rationale**: preserva el formato pedido por negocio y evita redefinir el separador de relaciones; el parser actual no es suficiente y debe corregirse para soportar CSV valido.
- **Alternatives considered**:
  - Cambiar el separador interno a `;`: rechazado porque contradice la decision funcional ya tomada.
  - Limitar una sola relacion por fila: rechazado porque degrada demasiado la ergonomia del import.

### 4. Resolucion tolerante de relaciones en dos pasos durante importacion
- **Decision**: separar la importacion en persistencia base del producto y resolucion posterior de `relatedProducts` dentro del mismo proceso asincrono.
- **Rationale**: una fila puede referenciar SKU ya existentes en la base o SKU creados en filas anteriores del mismo archivo. Resolver relaciones despues de persistir el producto base evita rechazar filas por orden de procesamiento y permite omitir solo los vinculos invalidos.
- **Alternatives considered**:
  - Validar relaciones por completo antes de importar cualquier fila: rechazado porque exigiría conocer todos los resultados finales por adelantado y volveria mas frágil el pipeline actual.
  - Reusar `validateRelatedProducts` tal cual en validacion previa: rechazado porque hoy convierte SKU faltantes en error fatal y no cumple el comportamiento acordado.

### 5. Trazabilidad de relaciones omitidas como warnings visibles
- **Decision**: registrar relaciones omitidas en el resultado por fila sin marcar el item como `error`; la UI de importacion debe poder mostrarlas junto al proceso final.
- **Rationale**: el usuario necesita saber que el producto entró pero alguna relacion no se aplicó. Eso no debe contaminar `errorItems`, pero sí debe quedar auditado.
- **Alternatives considered**:
  - Silenciar relaciones omitidas: rechazado porque haría dificil explicar por que `/related` devuelve menos datos que los esperados.
  - Contarlas como error de fila: rechazado porque contradice la regla de importar igual el producto.

### 6. UI de edicion inline en detalle de producto
- **Decision**: agregar un modo de edicion en la seccion de relacionados del detalle de producto, reutilizando servicios ya presentes (`ProductApi`, `ProductDetailData`) y cargando una lista de productos candidatos solo al entrar al modo de edicion.
- **Rationale**: mantiene el contexto del usuario, evita una pagina nueva y reutiliza el patron ya usado por el modal de transferencias para seleccionar SKU.
- **Alternatives considered**:
  - Modal dedicado separado: viable, pero agrega mas estructura sin aportar demasiado sobre un formulario relativamente pequeño.
  - Gestion desde listado de productos: rechazado porque las relaciones se entienden mejor desde el detalle de un SKU concreto.

## Risks / Trade-offs

- [Parser CSV casero no soporta comillas correctamente] -> Mitigacion: reemplazar el split lineal por un parser de celdas con comillas y cubrir casos con tests de comas y comillas escapadas.
- [Las relaciones a SKU del mismo archivo dependen del orden de importacion] -> Mitigacion: resolver relaciones despues de persistir filas validas y mantener un mapa de SKU importados/existentes antes de actualizar `relatedProducts`.
- [Warnings no visibles en la UI actual] -> Mitigacion: extender el modelo de item log o la respuesta de errores/detalles para incluir warnings y mostrarlos en el dialogo del proceso.
- [`GET /api/products` para elegir relaciones puede crecer demasiado] -> Mitigacion: en la primera fase UI reutilizar la lista existente bajo demanda; si el volumen crece, evolucionar a busqueda remota sin cambiar el contrato de edicion.
- [Actualizar `relatedProducts` desde la UI puede sobrescribir relaciones concurrentes] -> Mitigacion: cargar estado fresco al entrar a editar y guardar la lista completa intencionalmente; documentar que la ultima escritura prevalece en esta fase.

## Migration Plan

1. Actualizar las plantillas CSV/Excel para incluir `relatedProducts` y ejemplos citados compatibles con CSV.
2. Endurecer el parser CSV del bulk import para soportar comillas y celdas con comas internas.
3. Extender la validacion de filas para parsear relaciones y separar errores fatales de warnings de relaciones omitidas.
4. Persistir productos validos como hoy y agregar un paso de resolucion/actualizacion de `relatedProducts` dentro del mismo proceso asincrono.
5. Exponer warnings de relaciones omitidas en el tracking de importacion sin incrementar `errorItems`.
6. Actualizar el frontend de importacion para reflejar la nueva columna en la documentacion visual y mostrar warnings del proceso.
7. Actualizar interfaces y APIs de producto en frontend para editar `relatedProducts` desde el detalle.
8. Agregar UI de edicion de relaciones solo para `admin`, con lista de productos candidatos y tipos de relacion.
9. Verificar con tests backend y frontend, luego desplegar sin migracion de datos porque `relatedProducts` ya es opcional.

## Open Questions

- Ninguna bloqueante. El formato `SKU:type`, el orden de implementacion (CSV primero, luego UI), el comportamiento unidireccional y la regla de omitir relaciones invalidas ya fueron definidos.
