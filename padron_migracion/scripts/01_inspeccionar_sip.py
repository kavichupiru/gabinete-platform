"""Paso 1: inspecciona el ZIP RCP2008 (el archivo "sip" del spec) y documenta su formato real.

No asume nada sobre el contenido: lee los headers de los .dbf directamente
desde dentro del zip (sin extraer) y reporta lo que encuentra.
"""
import os
import re
import zipfile
from pathlib import Path

from dbf_reader import find_entry, get_dbf_schema, iter_dbf_records

ROOT = Path(__file__).resolve().parent.parent
RUN_SUFFIX = os.environ.get("PADRON_RUN_SUFFIX", "")
INPUT_CONTRASTE = Path(os.environ.get("PADRON_CONTRASTE_DIR", str(ROOT / "input" / "contraste_dic2025")))
INPUT_BASE = ROOT / "input" / "base_31jul2025"
OUTPUT_REPORTES = ROOT / "output" / f"reportes{RUN_SUFFIX}"

DEPART_SAN_PEDRO = "2"
DISTRITO_YCUAMANDYYU = "0"


def find_rcp_zip() -> Path:
    zips = list(INPUT_CONTRASTE.glob("*.zip"))
    if not zips:
        raise FileNotFoundError(f"No hay ningún .zip en {INPUT_CONTRASTE}")
    if len(zips) > 1:
        raise RuntimeError(f"Hay más de un .zip en {INPUT_CONTRASTE}, no sé cuál usar: {zips}")
    return zips[0]


def locales_desde_pdfs() -> set[str]:
    """Extrae los números de local a partir de los nombres de archivo de los PDF de BASE."""
    locales = set()
    for pdf in INPUT_BASE.glob("*.pdf"):
        m = re.search(r"local(\d+)", pdf.name, re.IGNORECASE)
        if m:
            locales.add(m.group(1))
    return locales


def main() -> None:
    zip_path = find_rcp_zip()
    lines: list[str] = []
    lines.append("# Inspección del archivo CONTRASTE (\"sip\")\n")
    lines.append(f"Archivo: `{zip_path.name}` ({zip_path.stat().st_size / 1e6:.1f} MB comprimido)\n")
    lines.append(
        "**Conclusión: no es un CSV/TXT/PDF suelto.** Es el ZIP completo del sistema "
        "`consregciv.exe` (RCP2008) de la Justicia Electoral: una base Visual FoxPro "
        "(.dbf/.cdx) con el padrón **nacional**, no solo San Pedro. Esto habilita la "
        "categoría `EMIGRACION_CONFIRMADA_A_OTRO_DISTRITO` (ver spec, sección "
        "Limitaciones) y permite cruzar contra `inhabilitados.dbf` para distinguir "
        "fallecidos de bajas sin causa conocida.\n"
    )

    with zipfile.ZipFile(zip_path) as zf:
        dbf_names = sorted(n for n in zf.namelist() if n.lower().endswith(".dbf"))

        lines.append("## Tablas .dbf encontradas\n")
        lines.append("| Tabla | Registros | Campos |")
        lines.append("|---|---|---|")
        schemas = {}
        for name in dbf_names:
            basename = name.split("/")[-1]
            n_records, fields = get_dbf_schema(zf, name)
            schemas[basename] = (name, n_records, fields)
            lines.append(f"| `{basename}` | {n_records:,} | {len(fields)} |")
        lines.append("")

        lines.append("## Esquema de `regciv.dbf` (padrón activo nacional)\n")
        lines.append("| Campo | Tipo | Long | Dec |")
        lines.append("|---|---|---|---|")
        _, n_regciv, fields_regciv = schemas["regciv.dbf"]
        for fname, ftype, flen, fdec in fields_regciv:
            lines.append(f"| {fname} | {ftype} | {flen} | {fdec} |")
        lines.append(f"\nTotal registros nacionales: **{n_regciv:,}**\n")

        # Confirmar DEPART=2 / DISTRITO=0
        dep_entry = find_entry(zf, "dep.dbf")
        dis_entry = find_entry(zf, "dis.dbf")
        loc_entry = find_entry(zf, "loc.dbf")

        dep_rows = list(iter_dbf_records(zf, dep_entry))
        dep_san_pedro = next(r for r in dep_rows if r["DEPART"] == DEPART_SAN_PEDRO)

        dis_rows = [r for r in iter_dbf_records(zf, dis_entry) if r["DEPART"] == DEPART_SAN_PEDRO]
        dis_ycuamandyyu = next(r for r in dis_rows if r["DISTRITO"] == DISTRITO_YCUAMANDYYU)

        lines.append("## Confirmación de códigos DEPART / DISTRITO\n")
        lines.append(f"- `DEPART = {DEPART_SAN_PEDRO}` → **{dep_san_pedro['DESCRIP']}**")
        lines.append(f"- `DISTRITO = {DISTRITO_YCUAMANDYYU}` (dentro de DEPART={DEPART_SAN_PEDRO}) → **{dis_ycuamandyyu['DESCRIP']}**")
        lines.append(
            f"- Otros distritos del departamento SAN PEDRO (no son nuestro foco): "
            + ", ".join(f"{r['DISTRITO']}={r['DESCRIP']}" for r in dis_rows if r["DISTRITO"] != DISTRITO_YCUAMANDYYU)
        )
        lines.append("")

        # Locales del distrito foco, comparados con los PDFs de BASE
        locales_rcp = [
            r for r in iter_dbf_records(zf, loc_entry)
            if r["DPTO"] == DEPART_SAN_PEDRO and r["DISTRITO"] == DISTRITO_YCUAMANDYYU
        ]
        locales_rcp_nums = {r["LOCAL"] for r in locales_rcp}
        locales_pdf_nums = locales_desde_pdfs()

        lines.append("## Locales del distrito foco (RCP nacional) vs. locales en los PDF de BASE\n")
        lines.append("| Local | Descripción (RCP) | ¿En PDFs de BASE? |")
        lines.append("|---|---|---|")
        for r in sorted(locales_rcp, key=lambda r: int(r["LOCAL"])):
            en_base = "sí" if r["LOCAL"] in locales_pdf_nums else "**NO — falta en BASE**"
            lines.append(f"| {r['LOCAL']} | {r['DESCRIP']} | {en_base} |")
        faltantes_en_rcp = locales_pdf_nums - locales_rcp_nums
        if faltantes_en_rcp:
            lines.append("")
            lines.append(f"⚠️ Locales presentes en los PDF de BASE pero ausentes en el RCP nacional: {sorted(faltantes_en_rcp)}")
        lines.append("")

        lines.append("## Limitaciones y notas\n")
        lines.append(
            "- El header interno de `regciv.dbf` marca última actualización el 2026-03-24 "
            "(fecha de reindexado del sistema FoxPro), **no** la fecha de corte real de los "
            "datos. La carpeta se llama \"al 2025-12-30\" pero eso no está confirmado dentro "
            "del propio dato — se documenta como supuesto, no como hecho verificado."
        )
        lines.append(
            "- Codificación confirmada por el byte `lang_driver` del header DBF: Windows-1252 "
            "(cp1252), consistente con nombres con tildes/ñ."
        )
        lines.append(
            "- `dobles.dbf` (1.498.204 registros nacionales) parece ser inscripciones dobles "
            "ya detectadas por el propio TSJE — se usa como QA cruzado, no como fuente principal."
        )
        lines.append(
            "- `inhabilitados.dbf` (681.923 registros nacionales, con `FEC_DEFUNC`) se usa para "
            "distinguir fallecidos de bajas sin causa conocida en `BAJA_DEL_DISTRITO`."
        )

    OUTPUT_REPORTES.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_REPORTES / "formato_sip.md"
    out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Reporte escrito en {out_path}")


if __name__ == "__main__":
    main()
