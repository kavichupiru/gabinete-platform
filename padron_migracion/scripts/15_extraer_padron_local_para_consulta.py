"""Extrae, SOLO para San Pedro Ycuamandyyú (DEPART=2, DISTRITO=0), los campos
necesarios para una consulta local/mesa/orden por cédula: 25.921 filas en vez
de las 5M+ del padrón nacional completo.

Es un recorte de alcance, no una autorización de publicación: el archivo que
genera sigue siendo PII sensible (cédula, nombre, fecha de nacimiento) y
queda en output/ (gitignored), igual que el resto del pipeline. Sirve como
insumo para decidir DESPUÉS, por separado, cómo (o si) se expone una consulta
sobre este subconjunto — no para subirlo a ningún lado tal cual.
"""
import csv
import os
import zipfile
from pathlib import Path

from dbf_reader import find_entry, iter_dbf_filtered, iter_dbf_records
from normalize import normalize_cedula

ROOT = Path(__file__).resolve().parent.parent
RUN_SUFFIX = os.environ.get("PADRON_RUN_SUFFIX", "")
CONTRASTE_LABEL = os.environ.get("PADRON_CONTRASTE_LABEL", "dic2025")
INPUT_CONTRASTE = Path(os.environ.get("PADRON_CONTRASTE_DIR", str(ROOT / "input" / "contraste_dic2025")))
OUTPUT_EXTRACTED = ROOT / "output" / f"extracted{RUN_SUFFIX}"

DEPART_SAN_PEDRO = "2"
DISTRITO_YCUAMANDYYU = "0"

FIELDNAMES = [
    "cedula", "apellido", "nombre", "fecha_nac",
    "local_cod", "local_desc", "mesa", "orden", "zona", "tipo_voto",
]


def find_rcp_zip() -> Path:
    zips = list(INPUT_CONTRASTE.glob("*.zip"))
    if len(zips) != 1:
        raise RuntimeError(f"Esperaba exactamente un .zip en {INPUT_CONTRASTE}, encontré {len(zips)}")
    return zips[0]


def main() -> None:
    zip_path = find_rcp_zip()

    with zipfile.ZipFile(zip_path) as zf:
        regciv_entry = find_entry(zf, "regciv.dbf")
        loc_entry = find_entry(zf, "loc.dbf")

        locales_desc = {
            r["LOCAL"]: r["DESCRIP"]
            for r in iter_dbf_records(zf, loc_entry)
            if r["DPTO"] == DEPART_SAN_PEDRO and r["DISTRITO"] == DISTRITO_YCUAMANDYYU
        }

        def es_san_pedro_ycuamandyyu(row: dict) -> bool:
            return row["DEPART"] == DEPART_SAN_PEDRO and row["DISTRITO"] == DISTRITO_YCUAMANDYYU

        filas = []
        cedulas_vistas = set()
        cedulas_repetidas = 0

        print("Leyendo regciv.dbf en streaming desde el zip (puede tardar unos minutos)...")
        for i, row in enumerate(iter_dbf_filtered(zf, regciv_entry, es_san_pedro_ycuamandyyu), 1):
            if i % 5000 == 0:
                print(f"  ...{i} filas encontradas")
            ced = normalize_cedula(row["CEDULA"])
            if ced in cedulas_vistas:
                cedulas_repetidas += 1
            cedulas_vistas.add(ced)

            filas.append({
                "cedula": ced,
                "apellido": row["APELLIDO"],
                "nombre": row["NOMBRE"],
                "fecha_nac": row["FEC_NAC"],
                "local_cod": row["LOCAL"],
                "local_desc": locales_desc.get(row["LOCAL"], ""),
                "mesa": row["MESA"],
                "orden": row["ORDEN"],
                "zona": row["ZONA"],
                "tipo_voto": row.get("DES_VOTO", ""),
            })

    OUTPUT_EXTRACTED.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_EXTRACTED / f"padron_local_consulta_{CONTRASTE_LABEL}.csv"
    with out_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(filas)

    print(f"\n{len(filas)} filas escritas en {out_path}")
    print(f"Cédulas repetidas dentro de este corte: {cedulas_repetidas}")
    print(
        "\nRecordatorio: este archivo tiene PII completa (cédula, nombre, fecha de "
        "nacimiento) de todo el distrito. Queda en output/ (gitignored) — no está "
        "commiteado ni preparado para publicarse en ningún lado todavía."
    )


if __name__ == "__main__":
    main()
