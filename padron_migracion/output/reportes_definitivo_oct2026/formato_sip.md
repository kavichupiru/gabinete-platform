# Inspección del archivo CONTRASTE ("sip")

Archivo: `RCP 2026-10-04 Padron.zip` (520.6 MB comprimido)

**Conclusión: no es un CSV/TXT/PDF suelto.** Es el ZIP completo del sistema `consregciv.exe` (RCP2008) de la Justicia Electoral: una base Visual FoxPro (.dbf/.cdx) con el padrón **nacional**, no solo San Pedro. Esto habilita la categoría `EMIGRACION_CONFIRMADA_A_OTRO_DISTRITO` (ver spec, sección Limitaciones) y permite cruzar contra `inhabilitados.dbf` para distinguir fallecidos de bajas sin causa conocida.

## Tablas .dbf encontradas

| Tabla | Registros | Campos |
|---|---|---|
| `FOXUSER.DBF` | 8 | 7 |
| `boletas_deshabilitadas.dbf` | 11,078 | 22 |
| `ciudades.dbf` | 318,467 | 5 |
| `comunidad_indigena.dbf` | 717 | 3 |
| `dep.dbf` | 18 | 4 |
| `desafiliaciones.dbf` | 0 | 14 |
| `desh_exte.dbf` | 8,941 | 22 |
| `dis.dbf` | 267 | 4 |
| `discapacidad.dbf` | 8 | 2 |
| `dobles.dbf` | 1,494,920 | 17 |
| `inhabilitados.dbf` | 678,517 | 26 |
| `loc.dbf` | 1,225 | 5 |
| `nacionalidades.dbf` | 206 | 4 |
| `part.DBF` | 0 | 14 |
| `pueblo_indigena.dbf` | 35 | 2 |
| `regciv.dbf` | 5,043,154 | 31 |
| `regciv_exte.dbf` | 57,245 | 19 |
| `tgen.DBF` | 8 | 5 |
| `tipoins.dbf` | 7 | 2 |
| `tiporeg.dbf` | 7 | 2 |
| `zon.dbf` | 304 | 5 |

## Esquema de `regciv.dbf` (padrón activo nacional)

| Campo | Tipo | Long | Dec |
|---|---|---|---|
| DEPART | N | 2 | 0 |
| DISTRITO | N | 2 | 0 |
| ZONA | N | 2 | 0 |
| LOCAL | N | 3 | 0 |
| MESA | N | 5 | 0 |
| ORDEN | N | 5 | 0 |
| TALON | N | 10 | 0 |
| BOLETA | N | 7 | 0 |
| CEDULA | N | 8 | 0 |
| NOMBRE | C | 35 | 0 |
| APELLIDO | C | 35 | 0 |
| SEXO | C | 1 | 0 |
| FEC_NAC | D | 8 | 0 |
| FEC_INSCRI | D | 8 | 0 |
| TIPO | C | 1 | 0 |
| ID_NACION | N | 3 | 0 |
| TIPO_VOTO | N | 1 | 0 |
| MENORES | C | 1 | 0 |
| INTERDICTO | C | 1 | 0 |
| POL_MIL | C | 1 | 0 |
| FISCALES | C | 1 | 0 |
| ES_INDIGEN | C | 1 | 0 |
| COD_PUEBLO | N | 3 | 0 |
| COD_COMUNI | N | 3 | 0 |
| TIENE_DISC | C | 1 | 0 |
| COD_DISCAP | N | 3 | 0 |
| REF_DISCAP | C | 120 | 0 |
| DIRECC | C | 1 | 0 |
| EDAD | N | 3 | 0 |
| DES_VOTO | C | 30 | 0 |
| _NullFlags | 0 | 3 | 0 |

Total registros nacionales: **5,043,154**

## Confirmación de códigos DEPART / DISTRITO

- `DEPART = 2` → **SAN PEDRO**
- `DISTRITO = 0` (dentro de DEPART=2) → **SAN PEDRO DEL YCUAMANDYYU**
- Otros distritos del departamento SAN PEDRO (no son nuestro foco): 33=SAN JOSE DEL ROSARIO, 21=SAN ESTANISLAO, 27=UNION, 1=25 DE DICIEMBRE, 3=ANTEQUERA, 5=CAPIIVARY, 7=CHORE, 9=GRAL. ELIZARDO AQUINO, 11=GRAL. F. RESQUIN, 13=GUAJAYVI, 15=ITACURUBI DEL ROSARIO, 17=LIMA, 19=NUEVA GERMANIA, 23=SAN PABLO, 25=TACUATI, 29=VILLA DEL ROSARIO, 31=YATAITY DEL NORTE, 24=SANTA ROSA DEL AGUARAY, 32=YRYBUCUA, 22=SAN VICENTE PANCHOLO, 16=LIBERACION

## Locales del distrito foco (RCP nacional) vs. locales en los PDF de BASE

| Local | Descripción (RCP) | ¿En PDFs de BASE? |
|---|---|---|
| 1 | COL.NAC.DE SAN PEDRO | sí |
| 2 | CENTRO FORMACION DOCENTE | sí |
| 3 | ESC.BASICA NRO 4118 SAN RAFAEL | sí |
| 501 | ESC. DE NARANJATY NRO.1688 | sí |
| 502 | ESC.DE LA COL. BARBERO NRO.2265 | sí |
| 503 | ESC.GRDA.506 DE CORREA RUGUA | sí |
| 504 | ESC. GRDA. DE PTO. YVAPOBO | sí |
| 505 | ESC. DE LA CPÑIA. SAN JUAN | sí |
| 506 | ESCUELA Nº2282 NTRA. SRA DE GUADALUPE | sí |
| 507 | ESC. BASICA NRO 1689 PIRI PUCU | sí |
| 508 | ESCUELA BASICA N° 4962 SAN RAFAEL | **NO — falta en BASE** |
| 509 | COL.NAC. DR. ANDRES BARBERO | **NO — falta en BASE** |

## Limitaciones y notas

- El header interno de `regciv.dbf` marca última actualización el 2026-03-24 (fecha de reindexado del sistema FoxPro), **no** la fecha de corte real de los datos. La carpeta se llama "al 2025-12-30" pero eso no está confirmado dentro del propio dato — se documenta como supuesto, no como hecho verificado.
- Codificación confirmada por el byte `lang_driver` del header DBF: Windows-1252 (cp1252), consistente con nombres con tildes/ñ.
- `dobles.dbf` (1.498.204 registros nacionales) parece ser inscripciones dobles ya detectadas por el propio TSJE — se usa como QA cruzado, no como fuente principal.
- `inhabilitados.dbf` (681.923 registros nacionales, con `FEC_DEFUNC`) se usa para distinguir fallecidos de bajas sin causa conocida en `BAJA_DEL_DISTRITO`.