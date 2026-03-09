# Caso de uso: Product Settings (Tipos de producto y atributos dinámicos)

## Objetivo
Habilitar a cada tenant para definir, versionar y publicar "Product Types" con atributos personalizados que se usan en altas/ediciones de productos y en carga masiva, manteniendo trazabilidad por versión y evitando rupturas.

## Actores
- **Admin de catálogo (tenant)**: define y publica tipos de producto y atributos.
- **Operador de producto**: crea/edita productos basados en un Product Type publicado.
- **Proceso de carga masiva**: valida filas contra el Product Type y su versión vigente al momento de la importación.

## Precondiciones
- El tenant tiene acceso al módulo Product Settings dentro del área admin.
- Existe al menos un Product Type inicial o el admin puede crear uno nuevo.

## Flujo principal
1. **Explorar tipos**: el admin abre Product Settings y ve tarjetas por cada Product Type con estado (Borrador/Publicado), versión y conteo de atributos/deprecados.
2. **Seleccionar tipo**: el admin elige un Product Type y se listan sus atributos ordenados con metadata (orden, versión, requerido, opciones, deprecated/activo).
3. **Editar atributos**:
   - Añadir atributo: define `key`, `label`, `type (text|number|date|select|multiselect|boolean)`, `required`, `order`, `options` (para select/multiselect) y `defaultValue` opcional.
   - Cambios breaking (cambiar tipo o eliminar) crean una nueva versión del atributo o del Product Type; atributos previos quedan `isDeprecated` pero se conservan para compatibilidad.
4. **Versionar y publicar**:
   - Guardar cambios mantiene el Product Type en estado **Borrador**.
   - Al pulsar **Publicar cambios**, se incrementa `version`, se sella `lastPublishedAt` y se bloquean rupturas sin migración.
5. **Consumo en productos**:
   - Formularios de alta/edición generan campos dinámicos a partir del Product Type publicado y su `version`.
   - Cada producto guarda `productTypeId` y `productTypeVersion` para validar compatibilidad futura.
6. **Carga masiva**:
   - La plantilla de importación se construye desde el Product Type publicado.
   - Cada fila valida `customAttributes` contra los atributos activos y la versión; errores por fila se reportan (campo faltante, tipo incorrecto, opción inválida).

## Reglas y validaciones
- No eliminar atributos en uso: se marca `isDeprecated = true` y se ofrece reemplazo.
- Atributos select/multiselect requieren `options` no vacías; `defaultValue` debe pertenecer al catálogo.
- Cambios de tipo requieren nueva versión; cambios no breaking (label, orden) pueden mantenerse en la misma versión de atributo si no rompen compatibilidad.
- `order` define el render y la plantilla de carga masiva; sin colisiones (debe ser único por Product Type).
- `isActive = false` oculta el atributo en nuevas altas, pero productos existentes conservan su valor.

## Excepciones / errores
- Intentar publicar con atributos inválidos (sin key, sin opciones para select, orden duplicado) bloquea la publicación y muestra el detalle.
- Carga masiva: filas con errores se rechazan con detalle; el lote puede admitir filas válidas si la política del tenant lo permite.
- Formulario de producto: si el Product Type del producto quedó obsoleto, se exige migrar o aceptar modo compatibilidad (solo lectura de atributos deprecated).

## Datos y trazabilidad
- `ProductType`: `{ id, name, version, status (draft|published), isActive, lastPublishedAt, attributes[] }`.
- `ProductAttribute`: `{ key, label, type, required, options?, defaultValue?, order, version, isDeprecated, isActive }`.
- Cada `Product` guarda `{ productTypeId, productTypeVersion, customAttributes: Record<key, value> }`.

## Métricas clave
- Tipos activos vs. publicados.
- Atributos totales y deprecados por Product Type.
- Errores por carga masiva (por campo y por fila).
- Tiempo promedio de publicación (borrador → publicado).

## Integraciones previstas
- **API ProductType**: CRUD + endpoint de publicación (incrementa versión) + listado de versiones.
- **API Validación de producto**: endpoint para validar payload de producto/carga masiva contra Product Type y versión.
- **Plantilla CSV/Excel**: generada dinámicamente desde el Product Type publicado.

## Roadmap sugerido
1) CRUD ProductType + publicación con control de rupturas.
2) Editor de atributos con validaciones y previsualización de formulario dinámico.
3) Integrar validación en carga masiva y en formularios de producto.
4) Historial de versiones y migraciones asistidas (mapear atributo deprecated → nuevo).
5) Métricas y alertas: reportes de errores de carga y uso de atributos.
