# Tareas para Corrección del Consolidado con Fórmulas de Atributos

## 1. Modificar la generación del Consolidado

- [x] 1.1 Ubicar el método que construye la hoja "Consolidado" en el servicio de plantillas multi-tipo
- [x] 1.2 Definir constante `ROWS_PER_TYPE = 1000`
- [x] 1.3 Implementar función auxiliar `columnLetter(index: number): string` para convertir índice numérico a letra de columna Excel
- [x] 1.4 Modificar el bucle de generación del Consolidado para que:
  - Itere sobre cada tipo de producto activo
  - Para cada tipo, itere `ROWS_PER_TYPE` veces generando una fila
  - `excelRow = currentRow + offset`
  - `typeRow = 2 + offset`
- [x] 1.5 Para cada fila del bloque, generar celdas en este orden:
  - A (sku): `=IF('{tipo}'!C{typeRow}="","",'{tipo}'!C{typeRow})`
  - B (ean): `=IF('{tipo}'!D{typeRow}="","",'{tipo}'!D{typeRow})`
  - C (name): `=IF('{tipo}'!E{typeRow}="","",'{tipo}'!E{typeRow})`
  - D (productTypeId): valor fijo (`type.id`)
  - E (productTypeVersion): valor fijo (`type.version.toString()`)
  - F (category): `=IF('{tipo}'!F{typeRow}="","",'{tipo}'!F{typeRow})`
  - G (price): `=IF('{tipo}'!G{typeRow}="","",'{tipo}'!G{typeRow})`
  - H (stock): `=IF('{tipo}'!H{typeRow}="","",'{tipo}'!H{typeRow})`
- [x] 1.6 Para cada `n` de 1 a 10:
  - Buscar `attr = type.attributes.find(a => a.csvColumn === n)`
  - Si existe y está activo: verificar que tenga índice y calcular columna
    - `idx = type.attributes.indexOf(attr)`
    - `colLetter = columnLetter(9 + idx)`
    - Fórmula: `=IF('{tipo}'!{colLetter}{typeRow}="","",'{tipo}'!{colLetter}{typeRow})`
  - Si no existe o está deprecated: celda vacía
- [x] 1.7 Avanzar `currentRow += ROWS_PER_TYPE` al terminar cada tipo

## 2. Verificación de hojas de tipo

- [x] 2.1 Confirmar que las hojas de tipo se generan antes que el Consolidado (orden actual es correcto)
- [x] 2.2 Verificar que los nombres de hoja no contengan caracteres inválidos para referencias Excel (ya manejado en Fase 1)

## 3. Tests

- [x] 3.1 Probar con un solo tipo activo con 3 atributos mapeados a csvColumn 1,2,3
  - Verificar que attr_1, attr_2, attr_3 tengan fórmulas correctas
  - Verificar que attr_4..10 estén vacíos
- [x] 3.2 Probar con dos tipos activos:
  - Tipo A con atributos en csvColumn 1,3,5
  - Tipo B con atributos en csvColumn 2,4,6
  - Verificar que en el bloque de A, attr_1,3,5 tengan fórmulas y 2,4,6 estén vacíos
  - Verificar que en el bloque de B, attr_2,4,6 tengan fórmulas y 1,3,5 estén vacíos
- [x] 3.3 Probar con tres tipos activos para verificar el avance correcto de bloques
- [x] 3.4 Abrir el Excel generado en Excel y Google Sheets, llenar datos en las hojas de tipo y verificar que el Consolidado refleje los valores
- [x] 3.5 Copiar el Consolidado a CSV e importar mediante el endpoint de bulk import, verificando que los atributos se lean correctamente

## 4. Verificación de no regresión

- [x] 4.1 Confirmar que la descarga de template por tipo individual (`GET /api/product-types/:id/template`) sigue funcionando
- [x] 4.2 Confirmar que el botón "Descargar plantilla general" en el frontend sigue descargando el archivo .xlsx
- [x] 4.3 Ejecutar tests existentes de generación de template y bulk import
