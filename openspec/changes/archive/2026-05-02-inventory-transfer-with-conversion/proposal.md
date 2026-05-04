## Why

Los tenants necesitan mover stock entre presentaciones relacionadas del mismo producto sin perder trazabilidad ni hacer ajustes manuales propensos a error. Hoy el sistema solo permite manejar stock por SKU de forma aislada, lo que impide casos operativos comunes como convertir sacos a detal usando una equivalencia basada en atributos dinámicos.

## What Changes

- Agregar campo opcional `conversionAttribute` en `ProductType` para identificar qué atributo numérico se usa en conversiones de inventario.
- Agregar campo opcional `relatedProducts` en `Product` con elementos `{ sku, type }` para vincular presentaciones relacionadas dentro del mismo tenant.
- Crear o actualizar el flujo `POST /api/inventory/transfer` para transferir stock entre SKU del mismo tenant.
- Aplicar conversión automática cuando origen y destino tengan `conversionAttribute` válido; mantener transferencia 1 a 1 cuando no exista configuración.
- Registrar cada intento de transferencia en `InventoryTransfer` con cantidades origen/destino, estado y metadatos de auditoría.
- Exponer consultas para historial de transferencias y productos relacionados.
- Mejorar el frontend con modal de transferencia que muestre vista previa del cálculo y con sección de relacionados en el detalle del producto.
- Mantener fuera de alcance la transferencia masiva por CSV en esta fase.

## Capabilities

### New Capabilities
- `product-relations`: Vinculación opcional entre SKU del mismo tenant para navegar entre presentaciones relacionadas.
- `inventory-transfer-with-conversion`: Transferencia de inventario entre SKU con conversión automática basada en atributos dinámicos configurados por tipo.

### Modified Capabilities
- `product-type-management`: Los tipos de producto pueden declarar un atributo numérico de conversión validado contra su definición de atributos.
- `inventory-management`: Los productos pueden almacenar relaciones entre SKU y participar en transferencias con trazabilidad y reglas de conversión.

## Impact

- Backend: cambios en modelos `ProductType` y `Product`, nuevo/actualizado modelo `InventoryTransfer`, servicio/controlador/router de transferencias y validaciones de conversión.
- Frontend: cambios en detalle de producto, modal de transferencia, vista previa de cálculo y navegación entre relacionados.
- Base de datos: nueva colección o ampliación de `InventoryTransfer`, nuevos campos opcionales e índices en `ProductType` y `Product`.
- Seguridad y permisos: `admin` ejecuta transferencias; `admin` y `operator` consultan historial y relacionados; `viewer` mantiene acceso de solo lectura general.
