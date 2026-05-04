## Context

En la Fase 1 se implementó la generación de un template Excel multi-tipo con:
- Una hoja por cada tipo de producto activo (con dropdowns y valores de ejemplo).
- Una hoja "Consolidado" que unifica todas las filas con columnas normalizadas `attr_1..attr_10`.

El Consolidado actual no genera las fórmulas para las columnas de atributos y asigna espacio desigual a los tipos. Esto impide que el usuario complete productos de varios tipos y luego importe el Consolidado como CSV.

## Goals / Non-Goals

**Goals:**
- Asignar 1000 filas por tipo de producto en el Consolidado, en bloques contiguos.
- Generar fórmulas `IF` en `attr_1..attr_10` que referencien la columna correcta de la hoja del tipo, según el mapeo `csvColumn`.
- Usar valores fijos para las columnas `productTypeId` y `productTypeVersion` en cada bloque.
- Mantener compatibilidad con el parser CSV existente (que ya soporta columnas `attr_1..10`).

**Non-Goals:**
- Cambiar el formato del CSV de entrada.
- Modificar el frontend o la UI de descarga.
- Alterar la estructura de las hojas de tipo.

## Decisiones

### 1. Bloques de 1000 filas por tipo

**Decisión**: Cada tipo de producto activo ocupa exactamente 1000 filas en el Consolidado, empezando en la fila 2. El primer tipo ocupa filas 2-1001, el segundo 1002-2001, etc.

**Razón**: Espacio suficiente para la mayoría de los casos de uso. El número es configurable en código.

**Alternativa**: Asignar filas proporcionales al número de atributos. Rechazada por complejidad innecesaria.

### 2. Fórmulas dinámicas para attr_1..10

**Decisión**: Para cada fila del bloque y cada `n` de 1 a 10, se busca en `type.attributes` el atributo con `csvColumn === n`. Si existe, se calcula la letra de columna correspondiente en la hoja del tipo y se genera la fórmula. Si no existe, celda vacía.

**Razón**: El mapeo `csvColumn` ya está implementado y validado en el modelo. Reutilizarlo aquí garantiza consistencia.

### 3. Valores fijos para productTypeId y version

**Decisión**: Las columnas D y E del Consolidado se rellenan con el valor fijo del `productTypeId` y `"1"` respectivamente, para todas las filas del bloque.

**Razón**: Evita fórmulas innecesarias y reduce el tamaño del archivo. El usuario no edita estas celdas en el Consolidado; son parte del encabezado lógico de cada bloque.

## Implementación

### Ubicación del cambio

Archivo: `backend/src/services/product-type.service.ts` - método `generateMultiTypeExcelTemplate`.

### Pseudocódigo

```typescript
const ROWS_PER_TYPE = 1000;

function columnLetter(index: number): string {
  let letter = '';
  let i = index;
  while (i > 0) {
    const remainder = (i - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    i = Math.floor((i - 1) / 26);
  }
  return letter;
}

// En el loop de generateMultiTypeExcelTemplate, para el Consolidado:
for (const type of activeTypes) {
  const sheetName = type.name.substring(0, 31);
  
  for (let offset = 0; offset < ROWS_PER_TYPE; offset++) {
    const excelRow = currentRow + offset;
    const typeRow = 2 + offset; // fila en la hoja del tipo (1=cabecera)

    // Columnas fijas A-H
    row.push(`=IF('${sheetName}'!C${typeRow}="","",'${sheetName}'!C${typeRow})`);
    row.push(`=IF('${sheetName}'!D${typeRow}="","",'${sheetName}'!D${typeRow})`);
    row.push(`=IF('${sheetName}'!E${typeRow}="","",'${sheetName}'!E${typeRow})`);
    row.push(type.id);
    row.push(type.version.toString());
    row.push(`=IF('${sheetName}'!F${typeRow}="","",'${sheetName}'!F${typeRow})`);
    row.push(`=IF('${sheetName}'!G${typeRow}="","",'${sheetName}'!G${typeRow})`);
    row.push(`=IF('${sheetName}'!H${typeRow}="","",'${sheetName}'!H${typeRow})`);

    // Columnas attr_1..10 (I-R = columnas 9-18)
    for (let n = 1; n <= 10; n++) {
      const attr = type.attributes.find(a => a.csvColumn === n);
      if (attr && attr.isActive && !attr.isDeprecated) {
        const idx = type.attributes.indexOf(attr);
        const colLetter = columnLetter(9 + idx);
        row.push(`=IF('${sheetName}'!${colLetter}${typeRow}="","",'${sheetName}'!${colLetter}${typeRow})`);
      } else {
        row.push('');
      }
    }

    consolidado.addRow(row);
    currentRow++;
  }
}
```

## Estructura del archivo Excel resultante

- Hoja "Comida" (columnas: A=productTypeId, B=version, C=sku, D=ean, E=name, F=category, G=price, H=stock, I=attr_1, J=attr_2, K=attr_3...)
- Hoja "Ropa" (columnas: A=productTypeId, B=version, C=sku, D=ean, E=name, F=category, G=price, H=stock, I=attr_1...)
- Hoja "Consolidado" (filas 2-1001: fórmulas a 'Comida', filas 1002-2001: fórmulas a 'Ropa')

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Si un tipo tiene más de 1000 productos, las filas extra no aparecerán en el Consolidado | Documentar el límite. En el futuro hacer configurable |
| Si el usuario inserta columnas en las hojas de tipo, el mapeo se rompe | Las hojas de tipo ya están protegidas contra inserción de columnas (Fase 1) |