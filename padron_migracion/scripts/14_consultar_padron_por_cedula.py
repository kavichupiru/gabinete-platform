"""Consulta local de votación, mesa y número de orden por cédula, usando
nuestra copia local del RCP2008 (no consulta el portal del TSJE).

No está limitado a San Pedro Ycuamandyyú: regciv.dbf es el padrón nacional
completo (5M+ registros), así que encuentra a cualquier elector del país
registrado en el corte cargado (PADRON_CONTRASTE_DIR).

Uso:
    # cédulas sueltas como argumentos
    python 14_consultar_padron_por_cedula.py 1234567 7654321

    # o un archivo con una cédula por línea (también acepta CSV con
    # encabezado "cedula" en la primera columna)
    python 14_consultar_padron_por_cedula.py --file ../input/consultas_cedulas.txt

Un solo pase de streaming sobre regciv.dbf (gracias a iter_dbf_by_cedulas),
sin importar cuántas cédulas se consulten a la vez.
"""
import argparse
import csv
import os
import sys
import zipfile
from pathlib import Path

from dbf_reader import find_entry, iter_dbf_by_cedulas, iter_dbf_records
from normalize import normalize_cedula

ROOT = Path(__file__).resolve().parent.parent
RUN_SUFFIX = os.environ.get("PADRON_RUN_SUFFIX", "")
CONTRASTE_LABEL = os.environ.get("PADRON_CONTRASTE_LABEL", "dic2025")
INPUT_CONTRASTE = Path(os.environ.get("PADRON_CONTRASTE_DIR", str(ROOT / "input" / "contraste_dic2025")))
OUTPUT_REPORTES = ROOT / "output" / f"reportes{RUN_SUFFIX}"


def find_rcp_zip() -> Path:
    zips = list(INPUT_CONTRASTE.glob("*.zip"))
    if len(zips) != 1:
        raise RuntimeError(f"Esperaba exactamente un .zip en {INPUT_CONTRASTE}, encontré {len(zips)}")
    return zips[0]


def leer_cedulas_de_archivo(path: Path) -> list[str]:
    cedulas = []
    with path.open(encoding="utf-8-sig") as f:
        for linea in f:
            valor = linea.strip().split(",")[0].strip()
            if valor and valor.lower() != "cedula":
                cedulas.append(valor)
    return cedulas


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("cedulas", nargs="*", help="Cédulas a consultar (sueltas)")
    parser.add_argument("--file", type=Path, help="Archivo con una cédula por línea (o CSV con columna 'cedula')")
    args = parser.parse_args()

    cedulas_raw = list(args.cedulas)
    if args.file:
        cedulas_raw.extend(leer_cedulas_de_archivo(args.file))
    if not cedulas_raw:
        sys.exit("No se dio ninguna cédula. Pasala como argumento o con --file <ruta>.")

    cedulas_norm = {normalize_cedula(c) for c in cedulas_raw}
    cedulas_norm.discard("")

    zip_path = find_rcp_zip()
    with zipfile.ZipFile(zip_path) as zf:
        regciv_entry = find_entry(zf, "regciv.dbf")
        loc_entry = find_entry(zf, "loc.dbf")
        dep_entry = find_entry(zf, "dep.dbf")
        dis_entry = find_entry(zf, "dis.dbf")

        dep_desc = {r["DEPART"]: r["DESCRIP"] for r in iter_dbf_records(zf, dep_entry)}
        dis_desc = {(r["DEPART"], r["DISTRITO"]): r["DESCRIP"] for r in iter_dbf_records(zf, dis_entry)}
        loc_desc = {(r["DPTO"], r["DISTRITO"], r["LOCAL"]): r["DESCRIP"] for r in iter_dbf_records(zf, loc_entry)}

        print(f"Buscando {len(cedulas_norm)} cédula(s) en regciv.dbf (streaming, un solo pase)...")
        encontrados = {}
        for row in iter_dbf_by_cedulas(zf, regciv_entry, cedulas_norm):
            ced = normalize_cedula(row["CEDULA"])
            encontrados[ced] = row

    filas_out = []
    for ced in cedulas_norm:
        row = encontrados.get(ced)
        if row is None:
            filas_out.append({
                "cedula_consultada": ced, "encontrado": "NO",
                "apellido": "", "nombre": "", "fecha_nac": "",
                "departamento": "", "distrito": "", "zona": "",
                "local_cod": "", "local_desc": "", "mesa": "", "orden": "", "tipo_voto": "",
            })
            continue
        dep = row["DEPART"]
        dis = row["DISTRITO"]
        loc = row["LOCAL"]
        filas_out.append({
            "cedula_consultada": ced, "encontrado": "SI",
            "apellido": row["APELLIDO"], "nombre": row["NOMBRE"], "fecha_nac": row["FEC_NAC"],
            "departamento": dep_desc.get(dep, dep),
            "distrito": dis_desc.get((dep, dis), dis),
            "zona": row["ZONA"],
            "local_cod": loc,
            "local_desc": loc_desc.get((dep, dis, loc), "(sin descripción)"),
            "mesa": row["MESA"],
            "orden": row["ORDEN"],
            "tipo_voto": row.get("DES_VOTO", ""),
        })

    OUTPUT_REPORTES.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_REPORTES / "consulta_padron_por_cedula.csv"
    with out_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=list(filas_out[0].keys()))
        writer.writeheader()
        writer.writerows(filas_out)

    no_encontradas = [f["cedula_consultada"] for f in filas_out if f["encontrado"] == "NO"]
    print(f"\n{len(filas_out) - len(no_encontradas)}/{len(filas_out)} cédulas encontradas -> {out_path}\n")
    for f in filas_out:
        if f["encontrado"] == "SI":
            print(
                f"  {f['cedula_consultada']:>9}  {f['apellido']}, {f['nombre']}  |  "
                f"{f['departamento']} / {f['distrito']}  |  Local {f['local_cod']} ({f['local_desc']})  |  "
                f"Mesa {f['mesa']}  |  Orden {f['orden']}"
            )
    if no_encontradas:
        print(f"\nNO encontradas ({len(no_encontradas)}): {', '.join(no_encontradas)}")
        print("(cédula no está en el padrón activo de este corte — puede ser inhabilitada, de otro corte, o el número está mal)")


if __name__ == "__main__":
    main()
