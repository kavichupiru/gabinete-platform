"""Paso 4: normaliza BASE y CONTRASTE al mismo esquema, según el spec.

- numero_ced: solo dígitos, sin ceros a la izquierda.
- fecha_nac / fecha_inscripcion: ISO YYYY-MM-DD (BASE viene D/M/YYYY del PDF,
  CONTRASTE viene YYYYMMDD del campo D de FoxPro — se autodetecta el formato).
- apellido_nombre_norm: mayúsculas sin tildes, para matches de nombre+fecha.
- No se descarta ninguna fila: las que no se puedan normalizar quedan con
  numero_ced/fecha_nac vacíos, para que 05_cruzar_padrones.py las mande a
  sin_clasificar.csv en vez de perderlas en silencio.
"""
import csv
import os
from pathlib import Path

from normalize import normalize_cedula, normalize_name, parse_date_ddmmyyyy, parse_date_yyyymmdd

ROOT = Path(__file__).resolve().parent.parent
RUN_SUFFIX = os.environ.get("PADRON_RUN_SUFFIX", "")
CONTRASTE_LABEL = os.environ.get("PADRON_CONTRASTE_LABEL", "dic2025")
OUTPUT_EXTRACTED = ROOT / "output" / f"extracted{RUN_SUFFIX}"

FIELDNAMES = [
    "numero_ced", "apellido_nombre", "apellido_nombre_norm",
    "fecha_nac", "fecha_inscripcion", "tipo_inscripcion",
    "departamento_cod", "departamento_desc", "distrito_cod", "distrito_desc",
    "zona_cod", "zona_desc", "local_cod", "local_desc",
    "mesa_orden", "talonario", "boleta", "archivo_origen", "corte",
]


def parse_fecha(raw: str) -> str | None:
    if not raw:
        return None
    if "/" in raw:
        return parse_date_ddmmyyyy(raw)
    return parse_date_yyyymmdd(raw)


def normalizar_csv(in_path: Path, corte_label: str) -> tuple[list[dict], int, int]:
    filas = []
    cedulas_invalidas = 0
    fechas_invalidas = 0

    with in_path.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            ced = normalize_cedula(row["numero_ced"])
            fecha_nac = parse_fecha(row["fecha_nac"])
            fecha_insc = parse_fecha(row.get("fecha_inscripcion", ""))

            if not ced or ced == "0":
                cedulas_invalidas += 1
            if row["fecha_nac"] and not fecha_nac:
                fechas_invalidas += 1

            filas.append({
                "numero_ced": ced,
                "apellido_nombre": row["apellido_nombre"],
                "apellido_nombre_norm": normalize_name(row["apellido_nombre"]),
                "fecha_nac": fecha_nac or "",
                "fecha_inscripcion": fecha_insc or "",
                "tipo_inscripcion": (row.get("tipo_inscripcion") or "").upper().strip(),
                "departamento_cod": row["departamento_cod"],
                "departamento_desc": row["departamento_desc"],
                "distrito_cod": row["distrito_cod"],
                "distrito_desc": row["distrito_desc"],
                "zona_cod": row["zona_cod"],
                "zona_desc": row.get("zona_desc", ""),
                "local_cod": row["local_cod"],
                "local_desc": row["local_desc"],
                "mesa_orden": row.get("mesa_orden", ""),
                "talonario": row.get("talonario", ""),
                "boleta": row.get("boleta", ""),
                "archivo_origen": row["archivo_origen"],
                "corte": corte_label,
            })

    return filas, cedulas_invalidas, fechas_invalidas


def escribir(filas: list[dict], out_path: Path) -> None:
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(filas)


def main() -> None:
    for nombre_in, corte_label, nombre_out in [
        ("base_31jul2025.csv", "BASE", "base_31jul2025_normalizado.csv"),
        (f"contraste_{CONTRASTE_LABEL}.csv", "CONTRASTE", f"contraste_{CONTRASTE_LABEL}_normalizado.csv"),
    ]:
        in_path = OUTPUT_EXTRACTED / nombre_in
        if not in_path.exists():
            raise FileNotFoundError(f"Falta {in_path} — corré primero el script de extracción correspondiente")

        filas, ced_inv, fecha_inv = normalizar_csv(in_path, corte_label)
        out_path = OUTPUT_EXTRACTED / nombre_out
        escribir(filas, out_path)
        print(f"{corte_label}: {len(filas)} filas -> {out_path}")
        if ced_inv or fecha_inv:
            print(f"  ADVERTENCIA: {ced_inv} cédulas inválidas, {fecha_inv} fechas de nacimiento inválidas (quedan vacías, no se descartan)")


if __name__ == "__main__":
    main()
