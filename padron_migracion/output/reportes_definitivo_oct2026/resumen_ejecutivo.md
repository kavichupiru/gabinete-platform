# Resumen ejecutivo — Cruce de padrones TSJE, San Pedro de Ycuamandyyú

BASE: corte 31/07/2025 (20 PDF del TSJE). CONTRASTE: RCP2008 nacional, padron definitivo "RCP 2026-10-04 Padron.zip" (fecha de corte real no confirmada dentro de los datos, ver formato_sip.md).

## Conteo por categoría

| Categoría | Cantidad |
|---|---|
| sin_cambio | 24900 |
| cambio_local_intradistrito | 385 |
| baja_del_distrito | 318 |
| emigracion_confirmada | 219 |
| alta_en_distrito | 636 |
| duplicados_probables | 120 |
| cedulas_repetidas | 0 |
| sin_clasificar | 0 |

### Subcategorías de ALTA_EN_DISTRITO (heurística por edad, no certeza)

| Subcategoría | Cantidad |
|---|---|
| ALTA_PROBABLE_TRANSFERENCIA | 563 |
| ALTA_PROBABLE_18_ANOS | 73 |

### Causa probable de BAJA_DEL_DISTRITO (solo cuando hay evidencia directa)

| Causa probable | Cantidad |
|---|---|
| FALLECIDO | 224 |
| DESCONOCIDA | 87 |
| INHABILITADO | 7 |

## Verificación: casos de duplicado ya conocidos (sanity check)

- AMARAL GONZALEZ, ADRIANA SOLEDAD: ✅ encontrado
- MOREL CABANA, MIRTA DIANA: ✅ encontrado
- SANABRIA CHILAVERT, DIEGO ANTONIO: ✅ encontrado

## Filas sin clasificar

0 filas no se pudieron clasificar (cédula vacía/inválida, fecha de nacimiento inválida, u otro problema de datos). Ver `sin_clasificar.csv` — nunca se descartan en silencio.

## Limitaciones documentadas

- **Fecha de corte real de CONTRASTE no confirmada.** El header interno de `regciv.dbf` refleja la fecha de reindexado del sistema, no necesariamente la fecha de corte de los datos. Se asumió 2026-10-04 (del nombre de carpeta/archivo del RCP) solo para la heurística de edad de `ALTA_EN_DISTRITO` — es un supuesto, no un hecho verificado.
- **La subclasificación de ALTA_EN_DISTRITO por edad (17.5–18.5 años vs. transferencia) es una heurística probabilística**, reflejada en el sufijo `_probable`, nunca afirmada como hecho.
- **`causa_probable=DESCONOCIDA` en BAJA_DEL_DISTRITO** significa que la cédula no aparece en ningún distrito del padrón nacional activo ni en `inhabilitados.dbf` — no se inventa una causa; puede deberse a depuración administrativa u otras razones no visibles en estos datos.
- Los locales 508, 509 y 999 ("sin descripción") existen en el RCP nacional pero no estaban en los PDF de BASE entregados — no se puede evaluar migración hacia/desde ellos en el corte BASE.