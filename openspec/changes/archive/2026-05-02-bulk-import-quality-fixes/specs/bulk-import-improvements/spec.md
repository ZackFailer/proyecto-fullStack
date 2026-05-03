## ADDED Requirements

### Requirement: Detección de duplicados intra-CSV
El sistema DEBERÁ detectar filas con SKU o EAN duplicado dentro del mismo archivo CSV antes de validar contra la base de datos.

#### Escenario: SKU duplicado en el CSV
- **CUANDO** un archivo CSV contiene dos o más filas con el mismo SKU
- **ENTONCES** las filas duplicadas serán marcadas como error de validación con mensaje "SKU duplicado en las filas X, Y"
- **Y** las filas sin duplicados internos se procesarán normalmente (las duplicadas no se insertarán)

#### Escenario: EAN duplicado en el CSV
- **CUANDO** un archivo CSV contiene dos o más filas con el mismo EAN
- **ENTONCES** las filas duplicadas serán marcadas como error de validación con mensaje "EAN duplicado en las filas X, Y"
- **Y** las filas sin duplicados internos se procesarán normalmente

#### Escenario: Archivo con SKU duplicado y otros errores
- **CUANDO** un archivo tiene filas con SKU duplicado Y otras filas con errores diferentes
- **ENTONCES** todas las filas con errores (duplicados u otros) serán marcadas y no se insertarán
- **Y** las filas válidas sin conflictos internos se importarán normalmente

### Requirement: Control de concurrencia por tenant
El sistema DEBERÁ prevenir que dos administradores del mismo tenant inicien importaciones simultáneas.

#### Escenario: Segundo import iniciado mientras uno está en progreso
- **CUANDO** un admin intenta iniciar una importación mientras existe otra en estado "processing" para el mismo tenant
- **ENTONCES** el sistema devolverá error 409 Conflict con mensaje "Ya hay una importación en progreso para este tenant"
- **Y** no se creará un nuevo proceso

#### Escenario: Proceso activo timeout (más de 30 minutos sin actualizar)
- **CUANDO** un admin intenta iniciar una importación y existe un proceso en estado "processing" con más de 30 minutos sin actualización
- **ENTONCES** el sistema marcará el proceso anterior como "failed" con motivo "timeout"
- **Y** permitirá iniciar la nueva importación

#### Escenario: Import anterior completada puede iniciar nueva
- **CUANDO** un admin intenta iniciar una importación y la anterior tiene estado terminal (completed/failed/partial)
- **ENTONCES** el sistema permitirá iniciar la nueva importación

#### Implementación de concurrencia
El control se implementará mediante:
1. Restricción única parcial en BD: índice único en (tenantId, status) con filtro solo para status = 'processing'
2. Verificación on-demand en código: al iniciar, verificar si existe proceso active y su updatedAt

### Requirement: Tipos de producto deprecados no permiten nuevas importaciones
El sistema DEBERÁ rechazar filas que referencian tipos de producto con `isActive: false`.

#### Escenario: Importar contra tipo deprecado
- **CUANDO** una fila del CSV referencia un productTypeId que existe pero tiene isActive: false
- **ENTONCES** la fila será marcada como error con mensaje "El tipo de producto 'X' está obsoleto y no permite nuevas importaciones"

### Requirement: Validación estricta de boolean
El sistema DEBERÁ validar que los valores de atributos booleanos sean exactamente true, false, 1, o 0.

#### Escenario: Valor booleano inválido
- **CUANDO** un atributo de tipo boolean recibe un valor diferente a true/false/1/0
- **ENTONCES** la fila será marcada como error con mensaje "El campo X debe ser true, false, 1 o 0"

### Requirement: Validación estricta de fecha
El sistema DEBERÁ validar que los valores de atributos de fecha cumplan formato ISO (YYYY-MM-DD) Y sean fechas válidas.

#### Escenario: Valor de fecha con formato inválido
- **CUANDO** un atributo de tipo date recibe un valor que no es formato ISO YYYY-MM-DD
- **ENTONCES** la fila será marcada como error con mensaje "El campo X debe tener formato YYYY-MM-DD"

#### Escenario: Valor de fecha con formato correcto pero fecha inválida
- **CUANDO** un atributo de tipo date recibe un valor como "2024-02-30" (fecha inválida)
- **ENTONCES** la fila será marcada como error con mensaje "El campo X contiene una fecha inválida"

**Nota:** Se validará que el año, mes y día sean números válidos, que el mes esté entre 01-12, y que el día sea válido para ese mes (incluyendo años bisiestos).

### Requirement: Cleanup de archivo después de procesamiento
El sistema DEBERÁ eliminar el contenido del archivo CSV después de completar el procesamiento.

#### Escenario: Proceso finalizado exitosamente
- **CUANDO** un proceso de importación alcanza estado terminal (completed/failed/partial)
- **ENTONCES** el sistema intentará eliminar el campo `fileContent` del proceso
- **Y** solo se conservarán los metadatos (filename, fileSize, status, contadores)

#### Escenario: Error en cleanup
- **CUANDO** la operación de eliminación de fileContent falla
- **ENTONCES** el sistema registrará un warning en logs
- **Y** el proceso mantendrá su estado terminal original (el fallo de cleanup no afecta el estado del proceso)
- **NOTA:** No es un error crítico; el proceso ya terminó y los datos de importación están completos.

#### Mejora futura (fuera del alcance actual)
- Considerar retención del archivo por 7 días para debugging
- Permitir descarga del archivo original desde la UI de historial
- Cleanup automático via job nocturno para procesos antiguos