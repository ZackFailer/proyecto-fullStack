## 1. Backend: Instalación y configuración de exceljs

- [x] 1.1 Instalar `exceljs` en el backend: `npm install exceljs`
- [x] 1.2 Importar la librería en `product-type.service.ts`

## 2. Backend: Implementar generación de Excel

- [x] 2.1 Crear método privado `generateExcelTemplate(type)` que reciba el tipo de producto con sus atributos.
- [x] 2.2 Crear workbook y worksheet con nombre "Template".
- [x] 2.3 Definir cabeceras: columnas fijas (`productTypeId`, `productTypeVersion`, `sku`, `name`, `category`, `price`, `stock`) y luego las columnas dinámicas (atributos).
- [x] 2.4 Escribir fila 1 de cabeceras con estilo (negrita, fondo gris claro, alineación centrada).
- [x] 2.5 Escribir fila 2 con valores de ejemplo para columnas fijas y dinámicas, usando misma lógica que el template CSV (valores por defecto).
- [x] 2.6 Para cada columna dinámica:
  - Si `attribute.type === 'select'` y tiene opciones: añadir data validation de tipo `list` con las opciones. Aplicar a la celda de ejemplo y a un rango razonable hacia abajo (ej. filas 2 a 1000 para que el usuario pueda añadir más filas).
  - Si `attribute.type === 'boolean'`: añadir lista con valores `true,false`.
  - Si `attribute.type === 'multiselect'`: añadir comentario en la celda de cabecera con texto "Usa ; para separar múltiples valores. Ejemplo: opcion1;opcion2".
- [x] 2.7 Ajustar ancho de columnas automáticamente según contenido (función `autoColumnWidth` o similar).
- [x] 2.8 Escribir el workbook a un buffer y devolverlo.

## 3. Backend: Adaptar endpoint de template

- [x] 3.1 En `product-type.controller.ts`, modificar el método `downloadTemplate` para aceptar un query parameter `format` (valores: `csv`, `xlsx`; por defecto `xlsx`).
- [x] 3.2 Llamar al método correspondiente del servicio (`generateTemplateCsv` o `generateTemplateXlsx`).
- [x] 3.3 Configurar las cabeceras de respuesta:
  - Para `xlsx`: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` y `Content-Disposition` con nombre de archivo `.xlsx`.
  - Para `csv`: comportamiento actual.
- [x] 3.4 Asegurar que el endpoint sigue protegido por autenticación y rol `admin`.

## 4. Frontend: Adaptar descarga

- [x] 4.1 En `product-settings.ts`, modificar `downloadTemplate()` para llamar al endpoint con `format=xlsx` (o nueva ruta).
- [x] 4.2 Manejar la respuesta como blob binario, crear URL y forzar descarga con extensión `.xlsx`.
- [x] 4.3 Actualizar cualquier mensaje o tooltip para reflejar que ahora es un archivo Excel.

## 5. Pruebas

- [x] 5.1 Crear un tipo de producto con atributo `select` (varias opciones). Descargar template Excel y verificar dropdown.
- [x] 5.2 Abrir el Excel en Google Sheets y verificar que el dropdown funcione correctamente.
- [x] 5.3 Probar con atributo `boolean` (dropdown con true/false).
- [x] 5.4 Probar con atributo `multiselect` (comentario visible en cabecera y valor de ejemplo con `;`).
- [x] 5.5 Llenar datos usando los dropdowns, guardar como CSV e importar en la aplicación. Verificar que los valores se importen correctamente.
- [x] 5.6 Probar descarga en formato CSV (query param `format=csv`) para verificar retrocompatibilidad.
- [x] 5.7 Ejecutar tests existentes de product types y bulk import.

## 6. Documentación

- [x] 6.1 Actualizar la guía de usuario (si existe) para indicar que el template ahora es Excel con dropdowns.
- [x] 6.2 Comunicar el cambio en release notes.