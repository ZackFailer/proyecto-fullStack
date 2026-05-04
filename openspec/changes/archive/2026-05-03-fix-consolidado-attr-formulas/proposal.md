# Proposal: fix-consolidado-attr-formulas

## Why

El template Excel multi-tipo implementado en la Fase 1 genera un archivo `.xlsx` con una hoja por tipo de producto y una hoja "Consolidado". Sin embargo, el Consolidado tiene dos defectos que lo hacen inutilizable:

1. **Atributos vacíos**: las columnas `attr_1` a `attr_10` no contienen fórmulas que referencien los atributos de las hojas de tipo. El usuario llena los datos en las hojas de tipo pero el Consolidado nunca los refleja.
2. **Bloques desbalanceados**: el primer tipo de producto activo recibe ~1000 filas en el Consolidado, mientras que el segundo tipo solo recibe una fila. No hay un criterio equitativo de asignación de espacio.

Esto impide que el usuario copie el Consolidado y lo guarde como CSV para importar productos de múltiples tipos en una sola carga, que es el objetivo principal del template multi-tipo.

## What Changes

- Se corrige el método de generación del Consolidado para que:
  - Asigne bloques de **1000 filas** para cada tipo de producto activo.
  - Genere fórmulas dinámicas para `attr_1..attr_10` basadas en el mapeo `csvColumn` de cada tipo.
  - Use valores fijos para `productTypeId` y `productTypeVersion` en lugar de fórmulas innecesarias.
- No se modifica el parser CSV, ni los modelos, ni el frontend.
- Se agregan tests para verificar la correcta generación con múltiples tipos.

## Capabilities

- **fixed-consolidado-template**: El Consolidado refleja correctamente todos los atributos de cada tipo de producto.

## Impact

- **Backend**: Modificación del servicio que genera el template Excel multi-tipo (aproximadamente 40 líneas de código).
- **Frontend**: Sin cambios.
- **Base de datos**: Sin cambios.