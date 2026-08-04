# Cruce de padrones TSJE — San Pedro de Ycuamandyyú

Cruza el corte BASE (PDFs del TSJE, 31/07/2025) contra el corte CONTRASTE
(RCP2008 nacional, carpeta "al 2025-12-30") para detectar migración electoral
e inscripciones duplicadas en San Pedro de Ycuamandyyú (DEPART=2, DISTRITO=0).

Ver `output/reportes/formato_sip.md` para el detalle de por qué el archivo
CONTRASTE no es un CSV/TXT sino la base FoxPro completa del sistema
`consregciv.exe` de la Justicia Electoral.

## Requisitos

- Python 3.11+ (probado con 3.13).
- ~1 GB libre en disco (no se extrae el ZIP nacional completo, solo se lee en
  streaming).

## Setup

```powershell
cd padron_migracion
py -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt
```

Colocar los insumos (no versionados, PII real):
- `input/base_31jul2025/*.pdf` — los 20 PDF del TSJE.
- `input/contraste_dic2025/*.zip` — el ZIP del RCP2008 tal cual (no extraer).

## Correr el pipeline (en orden)

```powershell
cd scripts
../.venv/Scripts/python.exe 01_inspeccionar_sip.py       # documenta el formato real del CONTRASTE
../.venv/Scripts/python.exe 02_extraer_pdfs_base.py       # PDFs -> output/extracted/base_31jul2025.csv
../.venv/Scripts/python.exe 03_extraer_contraste.py       # RCP nacional (streaming) -> contraste_dic2025.csv
../.venv/Scripts/python.exe 04_normalizar.py               # normaliza cédula/fechas/nombres de ambos cortes
../.venv/Scripts/python.exe 05_cruzar_padrones.py          # cruce + clasificación (incluye 2do pase nacional)
../.venv/Scripts/python.exe 06_generar_reportes.py         # CSVs finales + resumen_ejecutivo.md
../.venv/Scripts/python.exe 07_generar_planillas_por_local.py  # opcional: un .xlsx por local de votación
../.venv/Scripts/python.exe 08_generar_planilla_consolidada.py # opcional: un único .xlsx descargable con todo
../.venv/Scripts/python.exe 09_generar_resumen_migracion.py    # opcional: los CSV de reportes/ tal cual, en un .xlsx (una hoja por CSV)
../.venv/Scripts/python.exe 10_electores_por_distrito.py       # opcional: total de electores por distrito de San Pedro (corte CONTRASTE)
../.venv/Scripts/python.exe 11_generar_padron_actual_por_local.py  # opcional: un .xlsx por local con la lista real de electores vigente (dic/2025)
```

Cada script valida su propia entrada y aborta con un mensaje claro si falta
el output del paso anterior — no hace falta memorizar el orden, el primer
error te dice qué correr antes.

`02_extraer_pdfs_base.py` aborta si el conteo extraído no coincide con el
"Total de Electores del Local" impreso al pie de cada PDF — no debería
avanzar en silencio si se perdió una fila.

## Resultado

Todo queda en `output/reportes/`:

| Archivo | Contenido |
|---|---|
| `formato_sip.md` | Qué es realmente el archivo CONTRASTE, esquema de `regciv.dbf`, confirmación de códigos |
| `sin_cambio.csv` | Mismo local/zona en ambos cortes |
| `cambio_local_intradistrito.csv` | Sigue en el distrito pero cambió de local/zona |
| `baja_del_distrito.csv` | Estaba en BASE, no aparece en CONTRASTE (con `causa_probable` cuando hay evidencia) |
| `emigracion_confirmada.csv` | Baja de San Pedro Ycuamandyyú confirmada en otro distrito del padrón nacional |
| `alta_en_distrito.csv` | Nuevo en CONTRASTE, subclasificado `_probable` por edad |
| `duplicados_probables.csv` | Mismo apellido+nombre+fecha_nac, cédula distinta, dentro del mismo corte |
| `cedulas_repetidas.csv` | Misma cédula más de una vez en el mismo corte (error de carga) |
| `sin_clasificar.csv` | Lo que no se pudo evaluar (nunca se descarta en silencio) |
| `resumen_ejecutivo.md` | Conteos, sanity checks y limitaciones documentadas |

`planillas_por_local/local_<código>_<descripción>.xlsx` — una planilla por
local de votación, con una pestaña por categoría filtrada a ese local
(`Sin_Cambio`, `Cambio_Local_Salidas`/`Llegadas`, `Baja_Del_Distrito`,
`Emigracion_Confirmada`, `Alta_En_Distrito`, `Duplicados_Probables`,
`Cedulas_Repetidas`, `Sin_Clasificar`) más una pestaña `Resumen` con conteos.
En `CAMBIO_LOCAL_INTRADISTRITO` cada elector aparece en dos planillas: la del
local de origen (`Salidas`) y la del local de destino (`Llegadas`).

`padron_san_pedro_ycuamandyyu_consolidado.xlsx` — lo mismo que
`planillas_por_local/`, pero en **un solo archivo descargable**: hojas
`Resumen_Global` e `Indice_Por_Local` (matriz local × categoría) al frente,
seguidas de una hoja `L<código>_<categoría>` por cada combinación con al
menos una fila (las categorías en 0 para ese local no generan hoja, pero
quedan visibles en `Indice_Por_Local`).

`resumen_migracion.xlsx` — **el archivo único con todo**: `Resumen` (tabla de
conteos) + una hoja por cada CSV de `output/reportes/` con los datos
completos, + `Indice_Por_Local` + una hoja `L<código>_<categoría>` por cada
combinación local+categoría con datos (lo mismo que
`planillas_por_local/`/`padron_san_pedro_ycuamandyyu_consolidado.xlsx`, pero
todo junto en un solo libro). Es el que conviene compartir si solo se puede
mandar un archivo.

**`Indice_Por_Local` — cómo leer sus columnas:** las 9 columnas de categoría
(`Sin_Cambio`, `Cambio_Local_Salidas`, etc.) cuentan filas de esa categoría
para ese local, no electores — varias categorías se solapan a propósito
(p.ej. `Duplicados_Probables` marca filas que YA están en otra categoría) y
mezclan BASE con CONTRASTE. `total_filas_todas_categorias` es la suma cruda
de esas 9 columnas — **no es un conteo de electores**, sirve solo como
indicador de actividad del local. Para el número real de electores por
local, usar:
- `total_electores_base_31jul2025` = Sin_Cambio + Cambio_Local_Salidas + Baja_Del_Distrito + Emigracion_Confirmada
- `total_electores_contraste_dic2025` = Sin_Cambio + Cambio_Local_Llegadas + Alta_En_Distrito

Ambas columnas están validadas: sumadas en todos los locales dan exactamente
25.822 y 26.022 respectivamente, los mismos totales de
`base_31jul2025.csv`/`contraste_dic2025.csv`.

`padron_actual_por_local/local_<código>_<descripción>.xlsx` — el padrón REAL
y actual de cada local (corte CONTRASTE, dic/2025): la lista lisa de
electores, sin las categorías de migración. Es exactamente
`total_electores_contraste_dic2025` de `Indice_Por_Local`, desglosado nombre
por nombre. Columnas: `numero_ced`, `apellido_nombre`, `fecha_nacimiento`,
`tipo_inscripcion_base_31jul2025` (vacío si la persona no estaba en el corte
de julio), `tipo_inscripcion` (la vigente en diciembre). Generado con
`11_generar_padron_actual_por_local.py`; suma 26.022 electores en los 12
locales, igual que `contraste_dic2025.csv`.

`resumen_ejecutivo.docx` — versión Word formateada del resumen ejecutivo
(mismo contenido que `resumen_ejecutivo.md`, con tablas y estilo listo para
compartir). Generado con `scripts/_gen_docx_resumen.js`.

`formato_sip.docx` — versión Word formateada de la inspección del archivo
CONTRASTE (mismo contenido que `formato_sip.md`: qué es el RCP2008, esquema
de `regciv.dbf`, confirmación de códigos, locales del distrito). Generado con
`scripts/_gen_docx_formato_sip.js`.

`instructivo_operador_campo.docx` — guía en lenguaje no técnico para que un
operador de campo (sin conocimientos de datos) pueda encontrar y entender la
información de `resumen_migracion.xlsx`: cómo está organizado el archivo,
paso a paso para encontrar el detalle de su local, glosario de cada
categoría en términos operativos, y advertencias sobre qué es una estimación
`_probable` vs. un hecho confirmado y sobre confidencialidad de los datos
personales. Generado con `scripts/_gen_docx_instructivo_operador.js`.

`electores_por_distrito_sanpedro_dic2025.xlsx` — total de electores por cada
uno de los 22 distritos del departamento de San Pedro (no solo San Pedro del
Ycuamandyyú), corte CONTRASTE. Requiere otro pase de streaming sobre
`regciv.dbf` filtrando por `DEPART=2` sin filtrar por distrito. San Pedro del
Ycuamandyyú da 26.022, igual al total ya calculado en `contraste_dic2025.csv`
— sirve como validación cruzada de que ambos conteos leen el mismo dato.

Los generadores usan Node + `docx` (ya disponible en `node_modules/` del
repo) y comparten estilo desde `scripts/_docx_common.js` — correrlos de nuevo
regenera el archivo si cambian los datos.

## Correr el pipeline contra un corte CONTRASTE distinto (sin pisar corridas previas)

Todos los scripts (01-11) respetan estas variables de entorno; sin
definirlas, el comportamiento es exactamente el de siempre (corte
diciembre/2025, `output/extracted/` + `output/reportes/`):

| Variable | Default | Uso |
|---|---|---|
| `PADRON_CONTRASTE_DIR` | `input/contraste_dic2025` | Carpeta con el .zip del RCP (puede estar fuera del repo, ej. en otro disco) |
| `PADRON_CONTRASTE_LABEL` | `dic2025` | Etiqueta usada en nombres de archivo internos (`contraste_<label>.csv`) y en columnas como `total_electores_contraste_<label>` |
| `PADRON_CORTE_FECHA` | `2025-12-31` | Fecha asumida del corte, solo para la heurística de edad de `ALTA_EN_DISTRITO` |
| `PADRON_CONTRASTE_DESC` | descripción del corte dic/2025 | Texto libre para `resumen_ejecutivo.md` |
| `PADRON_RUN_SUFFIX` | `` (vacío) | Sufijo para las carpetas de salida: `output/extracted<suffix>/` y `output/reportes<suffix>/` |

Ejemplo (PowerShell) para correr contra un padrón "definitivo" nuevo sin
tocar la corrida anterior:

```powershell
$env:PADRON_RUN_SUFFIX = "_definitivo_oct2026"
$env:PADRON_CONTRASTE_LABEL = "oct2026_definitivo"
$env:PADRON_CONTRASTE_DIR = "D:\ruta\a\la\carpeta\del\zip"
$env:PADRON_CORTE_FECHA = "2026-10-04"
../.venv/Scripts/python.exe 02_extraer_pdfs_base.py   # BASE es fijo, pero hay que regenerarlo en la carpeta nueva
../.venv/Scripts/python.exe 03_extraer_contraste.py
../.venv/Scripts/python.exe 04_normalizar.py
../.venv/Scripts/python.exe 05_cruzar_padrones.py
../.venv/Scripts/python.exe 06_generar_reportes.py
../.venv/Scripts/python.exe 07_generar_planillas_por_local.py   # opcional
../.venv/Scripts/python.exe 09_generar_resumen_migracion.py     # opcional
../.venv/Scripts/python.exe 11_generar_padron_actual_por_local.py  # opcional
```

**Importante:** las variables tienen que estar seteadas en cada llamada a
`python.exe` de la corrida nueva (no persisten entre comandos de shell
distintos) — si se te olvida `PADRON_RUN_SUFFIX` en un paso, ese paso escribe
sobre la carpeta de salida por defecto (`output/reportes/`, la de
diciembre/2025) en vez de la nueva. Antes de correr una corrida paralela,
confirmá con `echo $env:PADRON_RUN_SUFFIX` que está seteada.

`resumen_ejecutivo_comparativo_dic2025_vs_oct2026.docx` (en
`output/reportes_definitivo_oct2026/`) — comparación lado a lado del corte de
diciembre/2025 contra el padrón definitivo de octubre/2026: total de
electores, diferencia (-101, cerca de los ~105 estimados por el equipo
político) y su descomposición exacta por categoría de migración (+153 bajas,
+51 altas, -1 emigración). Documenta como límite abierto el salto de
`causa_probable=DESCONOCIDA` en bajas (de 3 a 87 casos) — no se afirma una
causa sin evidencia. Generado con `scripts/_gen_docx_resumen_comparativo.js`.

## Limitaciones (ver detalle en resumen_ejecutivo.md)

- La fecha de corte real de CONTRASTE no está confirmada dentro de los datos.
- La subclasificación por edad de `ALTA_EN_DISTRITO` es una heurística, no una certeza.
- `causa_probable=DESCONOCIDA` significa "no encontramos evidencia", no "no tiene causa".
