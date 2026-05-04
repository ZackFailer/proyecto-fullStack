## Contexto

El sistema tiene Product Settings con atributos dinámicos, bulk import y templates Excel con dropdowns. Se necesita:

- Separar Productos (catálogo) de Inventario (stock y movimientos).
- Permitir carga masiva de todo el catálogo en un solo proceso.
- Mantener los dropdowns de Excel que ayudan al usuario a llenar valores válidos.
- Añadir transferencia de inventario con conversión, solo desde la UI.

## Objetivos / No-Objetivos

**Objetivos:**
- Reorganizar frontend en dos features: Productos e Inventario.
- Template Excel multi-tipo con una hoja por tipo (dropdowns) + hoja "Consolidado".
- CSV parser multi-tipo que acepta columnas `attr_1..10` y también columnas con nombre real (detección automática).
- `ProductType` define mapeo `csvColumn` para cada atributo.
- Transferencia de inventario con conversión configurable por tipo, solo desde UI.
- Historial de transferencias y timeline de movimientos por producto.
- Descarga del archivo original desde detalle del proceso.

**No-Objetivos:**
- Transferencias desde CSV.
- Rollback completo de procesos de carga (Fase 3).
- Ajuste manual de stock (Fase 4).
- Kits/ensamblaje (Fase 4).

## Decisiones

### 1. Template Excel multi-tipo: una hoja por tipo + Consolidado

**Decisión**: El template multi-tipo es un archivo Excel con:

- **Una hoja por tipo de producto** (`ropa`, `mueble`, `saco`...). Cada hoja tiene columnas con los nombres reales de los atributos de ese tipo, dropdowns para select/boolean, y una fila de ejemplo.
- **Una hoja "Consolidado"** que referencia todas las filas de todas las hojas de tipo y las presenta con columnas normalizadas `attr_1..attr_10`. Esta hoja es la que el usuario copia y guarda como CSV para importar.

**Razón**: El usuario llena cada tipo en su propia hoja con ayuda visual completa (dropdowns). La hoja "Consolidado" unifica todo automáticamente para la importación. Un solo archivo, sin perder dropdowns.

**Alternativa considerada**: Hoja única sin dropdowns + hoja de referencia. Descartada porque sacrifica la ayuda visual.

#### Detalle técnico de la hoja "Consolidado"

La hoja "Consolidado" se genera con fórmulas que referencian las celdas de las otras hojas. Para cada tipo de producto, se reserva un bloque de filas (ej. 1000 filas por tipo) con fórmulas como:

- A2: `=IF(ropa!A2="","",ropa!A2)`  # sku
- B2: `=IF(ropa!A2="","",ropa!B2)`  # ean
- H2: `=IF(ropa!A2="","","ropa")`   # productTypeId
- I2: `=IF(ropa!A2="","",ropa!G2)`  # attr_1 (según csvColumn del tipo)
- J2: `=IF(ropa!A2="","",ropa!H2)`  # attr_2

Esto implica que al generar el Excel, el backend conoce:

- Los tipos de producto activos del tenant.
- Para cada tipo, el mapeo `csvColumn` de cada atributo.
- La estructura de columnas de la hoja de ese tipo.

Las fórmulas `IF` aseguran que las filas vacías no generen contenido en el Consolidado. El usuario solo pega valores en las hojas de tipo; el Consolidado se actualiza solo al abrir en Excel/Sheets.

#### Flujo del usuario

1. Descarga el archivo Excel "catalogo_completo.xlsx".
2. Abre en Excel o Google Sheets.
3. Navega a la hoja de cada tipo y llena productos usando los dropdowns.
4. Va a la hoja "Consolidado" y verifica que todas sus filas aparezcan.
5. Copia la hoja "Consolidado" y la guarda como CSV.
6. Sube el CSV al bulk import.

### 2. Formatos de CSV aceptados por el parser

**Decisión**: El parser de bulk import detecta automáticamente el formato:

- **Formato A (multi-tipo)**: columnas `productTypeId`, `attr_1`...`attr_10`. Usa el `csvColumn` del tipo referenciado para mapear.
- **Formato B (por tipo, heredado)**: columnas con nombres reales de atributos (ej. `Color`, `Talla`). Usa el nombre para mapear al atributo del tipo.

**Razón**: Compatibilidad hacia atrás con templates antiguos, y flexibilidad para usuarios avanzados que generan sus propios CSVs.

**Detección**: Si las cabeceras contienen `attr_1`, se asume Formato A. Si contienen nombres de atributos conocidos, Formato B.

### 3. Mapeo `csvColumn` en ProductType

```json
{
  "attributes": [
    { "key": "peso", "type": "number", "csvColumn": 1 },
    { "key": "color", "type": "select", "options": ["rojo","azul"], "csvColumn": 2 }
  ]
}
```

`csvColumn`: entero de 1 a 10. Único dentro del tipo.

Obligatorio para todos los atributos (al crear/editar tipo).

Facilita la generación del Consolidado y el parseo del CSV multi-tipo.

### 4. Separación de features

| Feature | Responsabilidad | Páginas/Componentes |
|---------|-----------------|---------------------|
| Productos | Catálogo, tipos, carga masiva | Tipos de producto, Bulk Import (upload + historial), Detalle de proceso |
| Inventario | Stock, movimientos, transferencias | Lista de productos (vista stock), Detalle de producto (stock + timeline), Transferencia, Historial de transferencias |

### 5. Transferencia con conversión configurable

**Decisión**: `ProductType` tiene campo opcional `conversionAttribute`. Si ambos productos (origen y destino) pertenecen a tipos con `conversionAttribute` configurado y el atributo existe en ambos, se aplica conversión:

```
quantityTo = (quantityFrom × valueOrigen) / valueDestino
```

Debe ser entero exacto.

**Razón**: El tenant configura si necesita conversión y qué atributo usar. Si no se configura, transferencia 1 a 1.

### 6. Sin transferencias desde CSV

**Decisión**: El CSV solo acepta action: active, inactive. Las transferencias se hacen exclusivamente desde la UI de Inventario.

**Razón**: Operación entre dos productos, validación contextual, no se beneficia de flujo masivo.

### 7. Fallback de transacción MongoDB standalone

**Decisión**: El endpoint de transferencia intenta `withTransaction()`. Si falla con error de replica set, usa fallback atómico con compensación (two-phase write).

**Razón**: Funciona en cualquier entorno MongoDB sin requerir replica set.

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Las fórmulas del Consolidado pueden romperse si el usuario edita celdas equivocadas | Proteger con validación de Excel (celdas bloqueadas) la hoja Consolidado. Documentar que solo se editan las hojas de tipo. |
| Muchas hojas si el tenant tiene 50 tipos de producto | Excel soporta muchas hojas; se puede paginar o agrupar. No es problema para la mayoría de tenants. |
| csvColumn mal configurado | Validación al guardar ProductType. |

## Plan de fases

| Fase | Contenido |
|------|------------|
| Fase 1 | Separación de features + CSV multi-tipo + Template Excel multi-hoja |
| Fase 2 | Transferencia de inventario (UI) con conversión |
| Fase 3 | Auditoría, descarga de archivo original, timeline, deshacer transferencia |
| Fase 4 | Rollback de carga, ajuste manual de stock, kits |