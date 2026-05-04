## Context

El sistema ya soporta relaciones de productos en backend y frontend, pero hoy la importacion masiva obliga a expresar cada relacion como `SKU:type`. Ese formato expone una decision semantica que no es necesaria en la carga inicial y complica la edicion de archivos CSV/XLSX cuando el usuario solo quiere vincular productos por SKU. En paralelo, la UI de edicion manual ya permite elegir el tipo de relacion, pero el buscador de productos candidatos muestra muy poco contexto porque hoy solo trabaja con `sku` y `name`.

La hoja consolidada del template general ya incluye `relatedProducts`, por lo que este cambio no necesita alterar la estructura del workbook. El ajuste real se concentra en el contrato del import, en los ejemplos visibles de plantilla y en la forma en que la UI arma las opciones del selector usando el `conversionAttribute` numerico configurado en el tipo de producto.

## Goals / Non-Goals

**Goals:**
- Permitir que `relatedProducts` en importacion acepte una lista simple de SKU separados por comas.
- Asignar `related` como tipo por defecto a toda relacion creada desde importacion.
- Actualizar ejemplos y ayudas de las plantillas para reflejar el nuevo formato sin cambiar la posicion de la columna.
- Mostrar en la UI de relaciones `SKU - Nombre (Atributo: valor)` cuando el producto candidato tenga atributo de conversion numerico disponible.
- Mantener la edicion manual actual de tipos de relacion (`derived-from`, `component-of`, `variant-of`, `related`) sin cambios funcionales.

**Non-Goals:**
- No cambiar la hoja consolidada ni mover columnas existentes del template general.
- No eliminar ni renombrar los tipos de relacion soportados por el modelo.
- No inferir automaticamente tipos como `variant-of` o `component-of` durante importacion.
- No introducir un endpoint nuevo de busqueda especializada para relaciones en esta fase.
- No cambiar la logica de conversion de inventario; solo se mejora el contexto visual del selector.

## Decisions

### 1. Importacion simple con tipo `related` por defecto
- **Decision**: reinterpretar `relatedProducts` como una lista de SKU separados por comas en importacion (`SKU-002,SKU-003`) y persistir cada entrada resuelta con tipo `related`.
- **Rationale**: elimina friccion operativa en el flujo masivo y deja la semantica fina del tipo de relacion para el flujo manual, que ya cuenta con UI explicita.
- **Alternatives considered**:
  - Mantener `SKU:type`: rechazado porque obliga a usuarios operativos a decidir tipos durante una carga que suele ser preliminar.
  - Inferir el tipo automaticamente segun reglas de negocio: rechazado porque hoy no existe una regla unica y aumentaria ambiguedad.

### 2. Mantener tolerancia a errores en el pipeline actual
- **Decision**: conservar la validacion tolerante ya existente para relaciones no resolubles, duplicadas o autoreferenciales, cambiando solo el parser de entrada y los mensajes de warning al nuevo formato.
- **Rationale**: el cambio pedido es ergonomico, no de politica de importacion; no conviene reabrir el contrato de errores que ya fue acordado.
- **Alternatives considered**:
  - Endurecer la importacion ahora que el formato es mas simple: rechazado porque cambiaria el comportamiento visible para operadores sin necesidad funcional.

### 3. Resolver el texto enriquecido del selector desde datos ya disponibles
- **Decision**: enriquecer las opciones del selector de relaciones con `sku`, `name`, `productTypeId`, `customAttributes` y la metadata de tipos cargada desde frontend para resolver `conversionAttribute` -> etiqueta -> valor.
- **Rationale**: `GET /api/products` ya devuelve `productTypeId` y `customAttributes`; con una carga adicional de tipos de producto el frontend puede construir el texto `SKU - Nombre (Peso: 20)` sin modificar contratos backend existentes.
- **Alternatives considered**:
  - Cambiar `GET /api/products` para que devuelva un campo calculado listo para mostrar: rechazado por ser un acoplamiento de presentacion innecesario.
  - Mostrar solo el valor numerico sin etiqueta: rechazado porque sigue dejando ambiguedad sobre que atributo se esta usando.

### 4. Mantener el selector de tipo solo en la UI manual
- **Decision**: la importacion masiva no expondra tipos; la UI manual seguira ofreciendo `derived-from`, `component-of`, `variant-of` y `related` con el selector actual.
- **Rationale**: separa claramente dos casos de uso: carga rapida por archivo y ajuste semantico desde la pantalla de detalle.
- **Alternatives considered**:
  - Quitar el selector de tipo tambien de la UI: rechazado porque el usuario pidio conservar esos tipos por ahora.

## Risks / Trade-offs

- [Usuarios con archivos antiguos `SKU:type` pueden esperar compatibilidad] -> Mitigacion: actualizar ejemplos, mensajes de validacion y documentacion visual para dejar explicito el nuevo formato; definir si el parser rechaza o ignora `:` de forma consistente.
- [El selector necesita metadata de tipos ademas de productos] -> Mitigacion: cargar tipos bajo demanda al entrar en modo edicion y reutilizar el servicio existente de tipos en lugar de agregar otro endpoint.
- [Algunos productos no tendran `conversionAttribute` configurado o valor numerico cargado] -> Mitigacion: usar un fallback estable `SKU - Nombre` cuando falte metadata o valor.
- [La lista completa de productos puede crecer y volver pesado el selector] -> Mitigacion: mantener la carga bajo demanda como hoy y limitar este cambio a enriquecer las opciones ya cargadas.

## Migration Plan

1. Actualizar parser, warnings y ejemplos de importacion al formato simple de SKU.
2. Actualizar templates CSV/XLSX para que los ejemplos de `relatedProducts` ya no incluyan `:type`.
3. Ajustar y cubrir tests backend del parser y de persistencia por defecto con tipo `related`.
4. En frontend, cargar metadata de tipos al entrar en edicion de relaciones y construir etiquetas enriquecidas para las opciones del selector.
5. Verificar que guardar relaciones manuales siga permitiendo elegir cualquier tipo y que importacion siga usando `related` por defecto.

## Open Questions

- Definir explicitamente si el nuevo parser debe rechazar con warning cualquier entrada que contenga `:` o si debe tolerarla tratando solo la parte previa al separador. La implementacion recomendada es rechazarla como formato invalido para evitar ambiguedad silenciosa.
