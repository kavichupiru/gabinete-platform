"""Paso 3: extrae el corte CONTRASTE (RCP2008 nacional) filtrado a San Pedro de Ycuamandyyú.

Lee regciv.dbf **directamente desde dentro del ZIP, sin extraerlo** (streaming,
un solo pase de ~1.3GB / 5M registros), filtrando DEPART=2, DISTRITO=0.
Confirmado por muestreo: TIPO='A' (automática) o 'T' (tradicional).
"""
import csv
import os
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
    "numero_ced", "apellido_nombre", "fecha_nac", "tipo_inscripcion",
    "departamento_cod", "departamento_desc", "distrito_cod", "distrito_desc",
    "zona_cod", "zona_desc", "local_cod", "local_desc",
    "talonario", "boleta", "fecha_inscripcion", "archivo_origen",
]


def find_rcp_zip() -> Path:
    zips = list(INPUT_CONTRASTE.glob("*.zip"))
    if len(zips) != 1:
        raise RuntimeError(f"Esperaba exactamente un .zip en {INPUT_CONTRASTE}, encontré {len(zips)}")
    return zips[0]


def main() -> None:
    import zipfile

    zip_path = find_rcp_zip()

    with zipfile.ZipFile(zip_path) as zf:
        regciv_entry = find_entry(zf, "regciv.dbf")
        loc_entry = find_entry(zf, "loc.dbf")
        dep_entry = find_entry(zf, "dep.dbf")
        dis_entry = find_entry(zf, "dis.dbf")

        dep_desc = next(
            r["DESCRIP"] for r in iter_dbf_records(zf, dep_entry) if r["DEPART"] == DEPART_SAN_PEDRO
        )
        dis_desc = next(
            r["DESCRIP"] for r in iter_dbf_records(zf, dis_entry)
            if r["DEPART"] == DEPART_SAN_PEDRO and r["DISTRITO"] == DISTRITO_YCUAMANDYYU
        )
        locales_desc = {
            r["LOCAL"]: r["DESCRIP"]
            for r in iter_dbf_records(zf, loc_entry)
            if r["DPTO"] == DEPART_SAN_PEDRO and r["DISTRITO"] == DISTRITO_YCUAMANDYYU
        }

        def es_san_pedro_ycuamandyyu(row: dict) -> bool:
            return row["DEPART"] == DEPART_SAN_PEDRO and row["DISTRITO"] == DISTRITO_YCUAMANDYYU

        filas: list[dict] = []
        cedulas_vistas: set[str] = set()
        cedulas_repetidas = 0

        print("Leyendo regciv.dbf en streaming desde el zip (puede tardar unos minutos)...")
        for i, row in enumerate(iter_dbf_filtered(zf, regciv_entry, es_san_pedro_ycuamandyyu), 1):
            if i % 5000 == 0:
                print(f"  ...{i} filas de San Pedro de Ycuamandyyú encontradas")

            ced = normalize_cedula(row["CEDULA"])
            if ced in cedulas_vistas:
                cedulas_repetidas += 1
            cedulas_vistas.add(ced)

            apellido_nombre = f"{row['APELLIDO']}, {row['NOMBRE']}".strip(", ")
            filas.append({
                "numero_ced": row["CEDULA"],
                "apellido_nombre": apellido_nombre,
                "fecha_nac": row["FEC_NAC"],
                "tipo_inscripcion": {"A": "AUTOMATICA", "T": "TRADICIONAL"}.get(row["TIPO"], row["TIPO"]),
                "departamento_cod": row["DEPART"],
                "departamento_desc": dep_desc,
                "distrito_cod": row["DISTRITO"],
                "distrito_desc": dis_desc,
                "zona_cod": row["ZONA"],
                "zona_desc": "",  # regciv.dbf no trae descripción de zona; se deja vacío
                "local_cod": row["LOCAL"],
                "local_desc": locales_desc.get(row["LOCAL"], ""),
                "talonario": row["TALON"],
                "boleta": row["BOLETA"],
                "fecha_inscripcion": row["FEC_INSCRI"],
                "archivo_origen": f"{zip_path.name} :: regciv.dbf",
            })

    OUTPUT_EXTRACTED.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_EXTRACTED / f"contraste_{CONTRASTE_LABEL}.csv"
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(filas)

    print(f"\n{len(filas)} filas escritas en {out_path}")
    print(f"Cédulas repetidas dentro del corte CONTRASTE (San Pedro Ycuamandyyú): {cedulas_repetidas}")
    print(f"Locales encontrados: {sorted(locales_desc, key=lambda x: int(x))}")


if __name__ == "__main__":
    main()
