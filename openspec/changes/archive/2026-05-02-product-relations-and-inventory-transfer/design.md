## Context

El backend actual maneja productos con stock por tenant y validaciones de tipo de producto, pero no existe una forma nativa de relacionar SKU entre si ni de mover inventario entre ellos con trazabilidad.

El frontend expone listado y configuracion de productos, pero no ofrece una accion dedicada para transferencias ni una vista de relacionados. El objetivo de esta fase es cubrir la operacion base (transferencia 1 a 1) sin introducir conversiones por atributos ni complejidad adicional en importacion masiva.

## Goals / Non-Goals

**Goals:**
- Extender el producto con `relatedProducts` como campo opcional para modelar vinculos entre SKU del mismo tenant.
- Implementar `POST /api/inventory/transfer` para mover stock de un SKU origen a un SKU destino de forma atomica.
- Registrar auditoria de cada transferencia en `InventoryTransfer` con estados `pending`, `completed`, `failed`.
- Exponer consultas de historial (`GET /api/inventory/transfers`) y relacionados (`GET /api/products/:sku/related`) con control de roles.
- Agregar UX en frontend para disparar transferencias y visualizar productos relacionados en detalle de producto.

**Non-Goals:**
- Conversion automatica por atributos dinamicos (por ejemplo `peso_gramos`).
- Transferencias masivas por CSV o reutilizacion del pipeline de bulk import.
- Reglas avanzadas de composicion (kits, ensamblajes, BOM) o sincronizacion automatica al vender.

## Decisions

### 1) Relaciones embebidas en Product
- **Decision**: modelar `relatedProducts` como arreglo embebido `[{ sku, type }]` en `Product`.
- **Rationale**: mantiene lecturas simples desde el detalle de producto y evita joins/colecciones extra para la fase 1.
- **Alternatives considered**:
  - Coleccion dedicada `ProductRelation`: mejor para grafos complejos, pero mas costo operativo y de consultas para el alcance actual.

### 2) Transferencia 1 a 1 sin conversion
- **Decision**: endpoint recibe `fromSKU`, `toSKU`, `quantity`, `reason?` y aplica movimiento uno-a-uno.
- **Rationale**: cubre el caso base con semantica clara y minimiza errores por conversiones mal configuradas.
- **Alternatives considered**:
  - Conversion automatica por atributo dinamico en fase 1: rechazada para evitar acoplar reglas de negocio no estandarizadas.

### 3) Auditoria con estado y ejecucion en dos etapas
- **Decision**: crear registro `pending` antes de ejecutar la transaccion, luego marcar `completed` o `failed`.
- **Rationale**: preserva trazabilidad aun cuando falle la operacion o haya caidas intermedias.
- **Alternatives considered**:
  - Registrar solo al final: mas simple, pero pierde visibilidad de intentos fallidos.

### 4) Atomicidad en capa de servicio
- **Decision**: usar transaccion de MongoDB para decrementar origen y aumentar destino en la misma unidad atomica.
- **Rationale**: evita desbalances de stock en concurrencia o fallos parciales.
- **Alternatives considered**:
  - Dos `updateOne` sin transaccion: mayor riesgo de inconsistencias.

### 5) Permisos por rol
- **Decision**: `admin` puede transferir; `admin` y `operator` pueden consultar historial/relacionados; `viewer` solo lectura general sin acceso a operaciones restringidas.
- **Rationale**: se alinea con las reglas de permisos ya definidas para el proyecto.

## Risks / Trade-offs

- [Relacion por SKU invalido] -> Mitigacion: validar existencia en mismo tenant al crear/actualizar relaciones y al consultar relacionados.
- [Transferencias concurrentes sobre mismo SKU] -> Mitigacion: transaccion + condicion de stock suficiente en el update del origen.
- [Registros pending abandonados] -> Mitigacion: limpieza on-demand o job programado que marque `failed` por timeout.
- [Sin conversion automatica] -> Mitigacion: documentar que fase 1 es 1 a 1 y dejar extension planificada para fase 2.

## Migration Plan

1. Extender schema de `Product` con `relatedProducts` y crear indice sobre `relatedProducts.sku`.
2. Crear modelo `InventoryTransfer` con indices para historial y limpieza de pendientes.
3. Implementar servicio de transferencia con transaccion y registro de auditoria.
4. Exponer nuevos endpoints y aplicar middleware de autenticacion/autorizacion por rol.
5. Integrar frontend (API/data/page) para modal de transferencia y seccion de relacionados.
6. Agregar pruebas de integracion backend y pruebas frontend para permisos y estados.
7. Rollback: deshabilitar rutas nuevas y mantener datos historicos; campo `relatedProducts` es opcional, por lo que no bloquea lecturas existentes.

## Open Questions

- Se requiere paginacion fija o parametrizable para `GET /api/inventory/transfers`?
- Debe permitirse relacion bidireccional automatica al guardar (`A -> B` tambien crea `B -> A`) o se mantiene unidireccional explicita?
- El historial de transferencias debe incluir snapshot de nombre/categoria al momento de transferir o basta con SKU?
