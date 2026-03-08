# Caso de uso: Gestión de Productos

## Diseño propuesto del módulo ProductSettings (atributos por cliente)
- Scope: permitir que cada tenant defina un “productType” y sus atributos personalizados, con validación y versionado.
- Modelo base sugerido (Mongo, strict: true):
  - `ProductType` (por tenant): `{ _id, tenantId, name, isActive, attributes: [{ key, label, type, required, options?, defaultValue?, order, version, isDeprecated }] , audit }`.
  - `Product` mantiene referencia `productTypeId` y almacena `customAttributes` con llave = `key` del atributo.
  - `Product` incluye secciones estrictas: `media[]`, `pricing`, `inventory`, `permissions`, `audit` (ver ejemplo del prompt).
- Validación:
  - Backend: al crear/editar producto, validar `customAttributes` contra definiciones activas y versión del `productType`.
  - UI: formularios dinámicos generados desde `ProductType.attributes` (tipos: text, number, date, select, multiselect, boolean).
- Versionado:
  - Cambios breaking (cambiar tipo o eliminar atributo) crean una nueva versión del atributo o del productType; los productos existentes mantienen compatibilidad hasta migrar.
  - Guardar `productTypeVersion` en el producto para trazabilidad.
- Integridad:
  - No permitir eliminar atributos en uso; permitir desactivar/archivar y ocultar en altas nuevas.
  - Migraciones asistidas para mover valores cuando un atributo cambia clave o tipo.

## Plan de implementación (alto nivel)
1) Datos y contratos
	- Definir schemas: `ProductType`, `Product` (con `customAttributes`), `Media`, `Pricing`, `Inventory`, `Permissions`, `Audit`.
	- Endpoints: CRUD de `ProductType`; listar versiones; validar payload de producto contra `ProductType`.
2) UI/UX ProductSettings
	- Página de lista de ProductTypes (por tenant) con estado y versión.
	- Editor de atributos: agregar/editar tipos (text, number, date, select, multiselect, boolean), marcar requerido, opciones, orden.
	- Botón "publicar cambios" que incrementa versión y bloquea cambios breaking sin migración.
3) UI/UX Productos
	- Form de producto dinámico: render basado en `ProductType.attributes`; incluye secciones fijas: Medios, Pricing, Inventario, Permisos.
	- Select de ProductType; al cambiar, advertir sobre pérdida de datos no compatibles.
	- Tabla con filtros por texto, categoría, estado y atributos select tipo catálogo.
4) Validaciones y reglas
	- Backend: validación de tipos y requeridos; rechazo de atributos desconocidos; auditoría de cambios en pricing/stock.
	- Front: validaciones sincronizadas; tooltips y mensajes accesibles.
5) Migraciones y compatibilidad
	- Flujos para desactivar atributos y crear reemplazos; job de migración opcional.
	- Guardar `productTypeVersion` en cada producto; mostrar warning si la versión está desfasada.
6) Seguridad y permisos
	- Roles para editar ProductSettings; granularidad para editar pricing/stock vs. atributos.
	- Row-level en productos (`permissions.viewRoles`, `permissions.editRoles`).
7) Performance y datos
	- Indexar `tenantId`, `productTypeId`, campos comunes (sku, name, category), y atributos que sean catálogos (ej. color) vía índices parciales o proyección.
	- Paginación y búsqueda server-side; limitar tamaño de `media` y validar extensiones.
8) Carga masiva
	- Plantilla generada según ProductType vigente; validación previa y reporte de errores por fila; rollback de lote ante fallas.
9) Observabilidad
	- Logging estructurado de validaciones fallidas; métricas de uso de atributos; auditoría de cambios en ProductType y productos.


