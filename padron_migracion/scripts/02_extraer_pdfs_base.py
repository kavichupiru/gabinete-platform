"""Paso 2: extrae los 20 PDF de BASE (corte 31/07/2025) a un único CSV.

Formato confirmado por inspección (pdfplumber.extract_text() por página):
  Departamento: 2-SAN PEDRO : Zona 0-SAN PEDRO DEL YCUAMANDYYU
  Distrito : 0-SAN PEDRO DEL YCUAMANDYYU : Local 507 - ESC. BASICA NRO 1689 PIRI PUCU
  Orden Céd. Nº Apellido y Nombre Fec. de Nac. Talonario Boleta Fec. Inscrip Tip. Inscrip
   1 7.299.783 BENITEZ BARRETO, MARIA DEL ROSARIO 6/9/2007 0 0 1/3/2025 AUTOMATICA
  ...
  Total de Electores del Local: 7

El header (Departamento/Distrito/Zona/Local) se repite en cada página. El pie
"Total de Electores del Local: N" aparece una sola vez, en la última página
de cada archivo, y se usa para validar que no se perdieron filas.
"""
import csv
import os
import re
from collections import defaultdict
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parent.parent
RUN_SUFFIX = os.environ.get("PADRON_RUN_SUFFIX", "")
INPUT_BASE = ROOT / "input" / "base_31jul2025"
OUTPUT_EXTRACTED = ROOT / "output" / f"extracted{RUN_SUFFIX}"

RE_DEP_ZONA = re.compile(r"^Departamento:\s*(\d+)-(.+?)\s*:\s*Zona\s*(\d+)-(.+)$")
RE_DIS_LOCAL = re.compile(r"^Distrito\s*:\s*(\d+)-(.+?)\s*:\s*Local\s*(\d+)\s*-\s*(.+)$")
RE_ROW = re.compile(
    r"^([\d.]+)\s+([\d.]+)\s+(.+?)\s+(\d{1,2}/\d{1,2}/\d{4})\s+"
    r"([\d.]+)\s+([\d.]+)\s+(\d{1,2}/\d{1,2}/\d{4})\s+(\S+?)(\s+\*)?$"
)
RE_TOTAL = re.compile(r"^Total de Electores del Local:\s*([\d.]+)$")

# Totales conocidos del spec (footer de un único archivo, confirmados por inspección manual:
# Local 507 = tradicional, Local 504 y 505 = automática). Se usan como sanity check puntual,
# no como validación de todo el pipeline — la validación real es footer==filas_extraídas por archivo.
TOTALES_CONOCIDOS = {
    "san pedro_local507_piri pucu_tradicional.pdf": 33,
    "san pedro_local504_pto ybapovo_automatica.pdf": 272,
    "san pedro_local505_cñiasan juan_automatica.pdf": 74,
}

FIELDNAMES = [
    "numero_ced", "apellido_nombre", "fecha_nac", "tipo_inscripcion", "es_pueblo_indigena",
    "departamento_cod", "departamento_desc", "distrito_cod", "distrito_desc",
    "zona_cod", "zona_desc", "local_cod", "local_desc",
    "mesa_orden", "talonario", "boleta", "fecha_inscripcion", "archivo_origen",
]


def extraer_pdf(pdf_path: Path) -> tuple[list[dict], int | None]:
    """Devuelve (filas, total_declarado_en_pie) para un PDF."""
    filas: list[dict] = []
    total_declarado = None
    ctx = {
        "departamento_cod": None, "departamento_desc": None,
        "zona_cod": None, "zona_desc": None,
        "distrito_cod": None, "distrito_desc": None,
        "local_cod": None, "local_desc": None,
    }

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            for line in text.split("\n"):
                line = line.strip()

                m = RE_DEP_ZONA.match(line)
                if m:
                    ctx["departamento_cod"], ctx["departamento_desc"] = m.group(1), m.group(2).strip()
                    ctx["zona_cod"], ctx["zona_desc"] = m.group(3), m.group(4).strip()
                    continue

                m = RE_DIS_LOCAL.match(line)
                if m:
                    ctx["distrito_cod"], ctx["distrito_desc"] = m.group(1), m.group(2).strip()
                    ctx["local_cod"], ctx["local_desc"] = m.group(3), m.group(4).strip()
                    continue

                m = RE_TOTAL.match(line)
                if m:
                    total_declarado = int(m.group(1).replace(".", ""))
                    continue

                m = RE_ROW.match(line)
                if m:
                    orden, ced, nombre, fnac, talon, boleta, finsc, tipo, indigena = m.groups()
                    filas.append({
                        "numero_ced": ced,
                        "apellido_nombre": nombre.strip(),
                        "fecha_nac": fnac,
                        "tipo_inscripcion": tipo,
                        "es_pueblo_indigena": bool(indigena),
                        **ctx,
                        "mesa_orden": orden.replace(".", ""),
                        "talonario": talon.replace(".", ""),
                        "boleta": boleta.replace(".", ""),
                        "fecha_inscripcion": finsc,
                        "archivo_origen": pdf_path.name,
                    })

    return filas, total_declarado


def main() -> None:
    pdfs = sorted(INPUT_BASE.glob("*.pdf"))
    if not pdfs:
        raise FileNotFoundError(f"No hay PDFs en {INPUT_BASE}")

    todas_las_filas: list[dict] = []
    total_por_local: dict[str, int] = defaultdict(int)
    declarado_por_local: dict[str, int] = defaultdict(int)
    errores: list[str] = []

    for pdf_path in pdfs:
        filas, total_declarado = extraer_pdf(pdf_path)
        if not filas:
            errores.append(f"{pdf_path.name}: no se extrajo ninguna fila")
            continue

        local_cod = filas[0]["local_cod"]
        n_extraidas = len(filas)

        if total_declarado is not None and total_declarado != n_extraidas:
            errores.append(
                f"{pdf_path.name}: el pie de página declara {total_declarado} electores "
                f"pero se extrajeron {n_extraidas} filas"
            )

        esperado = TOTALES_CONOCIDOS.get(pdf_path.name)
        if esperado is not None:
            if n_extraidas == esperado:
                print(f"  OK: {pdf_path.name} = {n_extraidas} electores (coincide con el spec)")
            else:
                errores.append(
                    f"Sanity check del spec falló: {pdf_path.name} esperaba {esperado} "
                    f"electores, se extrajeron {n_extraidas}"
                )

        total_por_local[local_cod] += n_extraidas
        declarado_por_local[local_cod] += total_declarado or 0
        todas_las_filas.extend(filas)
        print(f"  {pdf_path.name}: {n_extraidas} filas (local {local_cod})")

    if errores:
        print("\nERRORES DE VALIDACIÓN:")
        for e in errores:
            print(f"  - {e}")
        raise SystemExit(f"\nSe encontraron {len(errores)} problema(s) de validación. Abortando sin escribir CSV.")

    OUTPUT_EXTRACTED.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_EXTRACTED / "base_31jul2025.csv"
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(todas_las_filas)

    print(f"\n{len(todas_las_filas)} filas escritas en {out_path}")
    print(f"Locales encontrados: {sorted(total_por_local, key=lambda x: int(x))}")


if __name__ == "__main__":
    main()
