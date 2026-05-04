## Context

El sistema actual ya maneja productos con `customAttributes`, tipos de producto versionados por tenant y un flujo básico de transferencia de inventario 1 a 1 entre SKU. Sin embargo, esa transferencia no contempla conversiones entre presentaciones distintas ni una forma formal de vincular productos relacionados, lo que deja fuera casos operativos frecuentes como transformar sacos a unidades de detal.

La base funcional ya existe en Product Settings: cada tenant puede definir atributos dinámicos por tipo. Este cambio aprovecha esa flexibilidad para que el tenant declare explícitamente qué atributo numérico sirve como base de conversión, evitando reglas rígidas codificadas en el core.

## Goals / Non-Goals

**Goals:**
- Permitir que un `ProductType` declare un `conversionAttribute` opcional apuntando a un atributo numérico propio.
- Permitir que un `Product` guarde `relatedProducts` para conectar presentaciones relacionadas del mismo tenant.
- Implementar una transferencia de inventario que aplique conversión automática cuando origen y destino tengan atributos de conversión válidos.
- Mantener la operación atómica y auditada con estado `pending`, `completed` o `failed`.
- Mostrar en frontend la vista previa del cálculo y las relaciones entre SKU.

**Non-Goals:**
- Transferencias masivas vía CSV.
- Conversión automática durante ventas, kits, BOM o ensamblajes.
- Inferir atributos de conversión por nombres mágicos sin configuración explícita.
- Permitir resultados fraccionarios en el stock destino.

## Decisions

### 1) `conversionAttribute` vive en `ProductType`
- **Decision**: agregar `conversionAttribute?: string` al modelo de `ProductType`.
- **Rationale**: el tenant define explícitamente qué atributo numérico representa la magnitud de conversión (`peso_gramos`, `weight_grams`, etc.) y el backend puede validarlo al crear o actualizar tipos.
- **Alternatives considered**:
  - Detectar atributos por convención de nombres: rechazado por ser ambiguo y frágil.
  - Configurar el atributo por producto individual: rechazado porque rompe consistencia entre productos del mismo tipo.

### 2) Conversión basada en atributos numéricos de ambos productos
- **Decision**: si origen y destino tienen `conversionAttribute`, calcular `quantityTo = (quantityFrom * factorOrigen) / factorDestino`.
- **Rationale**: esto permite conversiones entre presentaciones heterogéneas sin hardcodear unidades. El cálculo se apoya en datos ya presentes en `customAttributes`.
- **Alternatives considered**:
  - Mantener siempre 1 a 1: insuficiente para presentaciones distintas.
  - Definir factores por relación SKU-SKU: más flexible, pero añade una capa de configuración extra fuera del alcance inicial.

### 3) Solo se permiten conversiones exactas
- **Decision**: rechazar la transferencia cuando `quantityTo` no sea entero exacto.
- **Rationale**: el stock actual del sistema se maneja como conteo entero por SKU; aceptar fracciones generaría inconsistencias operativas y contables.
- **Alternatives considered**:
  - Redondear automáticamente: rechazado porque distorsiona inventario.
  - Guardar decimales en stock: fuera de alcance y de alto impacto en el modelo actual.

### 4) Fallback explícito a transferencia 1 a 1
- **Decision**: si alguno de los tipos no tiene `conversionAttribute`, mantener comportamiento 1 a 1.
- **Rationale**: conserva compatibilidad con tenants que no necesiten conversión y evita bloquear transferencias simples.
- **Alternatives considered**:
  - Exigir siempre conversión configurada: demasiado restrictivo para la fase inicial.

### 5) Auditoría enriquecida por transferencia
- **Decision**: el registro `InventoryTransfer` debe guardar `quantityFrom`, `quantityTo`, `conversionApplied` y datos suficientes para explicar el resultado.
- **Rationale**: la transferencia deja de ser un simple movimiento simétrico; el historial debe poder mostrar qué cantidad salió, cuál entró y si hubo conversión.
- **Alternatives considered**:
  - Guardar solo `quantity`: insuficiente para trazabilidad cuando origen y destino difieren.

### 6) Relaciones embebidas en `Product`
- **Decision**: modelar `relatedProducts` como arreglo embebido `[{ sku, type }]` en `Product`.
- **Rationale**: mantiene lectura simple en detalle de producto y permite navegación en frontend sin colección extra.
- **Alternatives considered**:
  - Colección separada de relaciones: más flexible, pero agrega complejidad innecesaria para el alcance actual.

### 7) Vista previa de conversión en frontend
- **Decision**: el modal de transferencia debe mostrar, antes de confirmar, si la operación es 1 a 1 o convertida y cuál es el cálculo esperado.
- **Rationale**: la UI reduce errores de configuración y permite validar visualmente la operación antes de mutar inventario.
- **Alternatives considered**:
  - Mostrar solo el resultado después de transferir: demasiado tarde para prevenir errores.

## Risks / Trade-offs

- [Configuración incorrecta de `conversionAttribute`] -> Mitigación: validar que exista y sea numérico en `ProductType`, y validar que ambos productos tengan valor numérico al transferir.
- [Resultado no entero en la conversión] -> Mitigación: rechazar la operación con mensaje que incluya el cálculo esperado.
- [Transferencias concurrentes sobre el mismo SKU] -> Mitigación: usar transacción MongoDB con verificación de stock suficiente en el update del origen.
- [Tenants mezclando productos relacionados sin equivalencia real] -> Mitigación: mantener la relación visual separada de la lógica de conversión; la transferencia solo usa datos de `conversionAttribute`.
- [Historial inconsistente si la app cae a mitad de proceso] -> Mitigación: crear auditoría en `pending` antes de la transacción y marcar como `failed` por limpieza si expira.

## Migration Plan

1. Extender `ProductType` con `conversionAttribute` y validar contra su definición de atributos.
2. Extender `Product` con `relatedProducts` e índices para consulta por SKU relacionado.
3. Ajustar `InventoryTransfer` para registrar cantidades origen/destino y metadatos de conversión.
4. Actualizar servicio/controlador/router de transferencias para soportar cálculo con fallback 1 a 1.
5. Agregar endpoints de historial y relacionados con permisos por rol.
6. Integrar frontend en detalle de producto y modal de transferencia con vista previa.
7. Añadir pruebas de validación, permisos, conversiones exactas y errores.
8. Rollback: deshabilitar endpoints nuevos; `conversionAttribute` y `relatedProducts` son opcionales, por lo que no rompen lecturas existentes.

## Open Questions

- ¿La UI debe permitir transferir únicamente hacia SKU relacionados o también a cualquier SKU del tenant?
- ¿Conviene guardar en auditoría los factores usados (`factorOrigen`, `factorDestino`) además del resultado final?
- ¿La validación de exactitud debe tolerar pequeños errores de punto flotante si el atributo numérico se almacena como decimal?
